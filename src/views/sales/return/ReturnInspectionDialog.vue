<script setup lang="ts">
import { computed, onMounted, reactive, ref } from "vue";
import {
  createReturnInspectionApi,
  getClaimDefectCategoryListApi,
  getReturnInspectionListApi
} from "@/api/business/order";
import { message } from "@/utils";
import type { SalesReturnDetail } from "./types";

type DefectCategoryOption = {
  id: number;
  name: string;
};

type InspectionRecord = {
  uid?: string;
  serialNo?: string;
  result?: "GOOD_RETURN" | "DEFECTIVE" | "SCRAPPED";
  inspectedBy?: string;
  remark?: string;
  createdAt?: string;
  defectCategory?: { name?: string };
};

type DraftItem = {
  serialNo: string;
  result: "GOOD_RETURN" | "DEFECTIVE" | "SCRAPPED";
  inspectedBy: string;
  remark: string;
  defectCategoryId?: number;
};

const props = defineProps<{
  orderUid: string;
  details: SalesReturnDetail[];
}>();

const loading = ref(false);
const saving = ref(false);
const defectCategoryOptions = ref<DefectCategoryOption[]>([]);
const inspectionMap = ref<Record<string, InspectionRecord[]>>({});
const draftMap = reactive<Record<string, DraftItem[]>>({});

const eligibleDetails = computed(() =>
  (props.details || []).filter(
    detail =>
      detail.uid &&
      Array.isArray(detail.serialNumbers) &&
      detail.serialNumbers.length > 0
  )
);

function getResultLabel(value?: string) {
  switch (value) {
    case "GOOD_RETURN":
      return "良品退回";
    case "DEFECTIVE":
      return "不良";
    case "SCRAPPED":
      return "报废";
    default:
      return "-";
  }
}

function getInspections(detailUid?: string) {
  if (!detailUid) return [];
  return inspectionMap.value[detailUid] || [];
}

function getPendingSerials(detail: SalesReturnDetail) {
  const serialNos = (detail.serialNumbers || []).map(item => item.serialNo);
  const inspected = new Set(
    getInspections(detail.uid)
      .map(item => item.serialNo)
      .filter(Boolean)
  );
  return serialNos.filter(serialNo => !inspected.has(serialNo));
}

function initDraft(detail: SalesReturnDetail) {
  if (!detail.uid) return;
  const pending = getPendingSerials(detail);
  draftMap[detail.uid] = pending.map(serialNo => ({
    serialNo,
    result: "GOOD_RETURN",
    inspectedBy: "",
    remark: ""
  }));
}

async function loadDetailInspections(detailUid: string) {
  const { code, data, msg } = await getReturnInspectionListApi(
    props.orderUid,
    detailUid
  );
  if (code !== 200) {
    message(msg || "加载退货质检记录失败", { type: "error" });
    return;
  }
  inspectionMap.value = {
    ...inspectionMap.value,
    [detailUid]: Array.isArray(data) ? (data as InspectionRecord[]) : []
  };
}

async function loadBaseData() {
  loading.value = true;
  try {
    const [{ code: categoryCode, data: categoryData, msg: categoryMsg }] =
      await Promise.all([getClaimDefectCategoryListApi()]);
    if (categoryCode !== 200) {
      message(categoryMsg || "加载缺陷类别失败", { type: "error" });
      return;
    }
    defectCategoryOptions.value = Array.isArray(categoryData)
      ? (categoryData as DefectCategoryOption[])
      : [];

    for (const detail of eligibleDetails.value) {
      if (!detail.uid) continue;
      await loadDetailInspections(detail.uid);
      initDraft(detail);
    }
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "加载退货质检失败";
    message(msg, { type: "error" });
  } finally {
    loading.value = false;
  }
}

async function saveDetail(detail: SalesReturnDetail) {
  if (!detail.uid) return;
  const draft = draftMap[detail.uid] || [];
  if (draft.length === 0) {
    message("当前明细没有待质检胎号", { type: "warning" });
    return;
  }

  saving.value = true;
  try {
    const { code, msg } = await createReturnInspectionApi(
      props.orderUid,
      detail.uid,
      {
        items: draft.map(item => ({
          serialNo: item.serialNo,
          result: item.result,
          inspectedBy: item.inspectedBy.trim() || undefined,
          remark: item.remark.trim() || undefined,
          defectCategoryId: item.defectCategoryId
        }))
      }
    );
    if (code !== 200) {
      message(msg || "保存退货质检失败", { type: "error" });
      return;
    }
    message("退货质检已保存", { type: "success" });
    await loadDetailInspections(detail.uid);
    initDraft(detail);
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "保存退货质检失败";
    message(msg, { type: "error" });
  } finally {
    saving.value = false;
  }
}

onMounted(() => {
  void loadBaseData();
});
</script>

<template>
  <div class="space-y-4">
    <el-card
      v-for="detail in eligibleDetails"
      :key="detail.uid || detail.tireId"
      shadow="never"
    >
      <template #header>
        <div class="flex items-center justify-between">
          <div class="font-medium">
            {{ detail.tireName || detail.tireId }}
          </div>
          <div class="text-sm text-gray-500">
            质检状态：{{ detail.qcStatus || "PENDING" }}
          </div>
        </div>
      </template>

      <div class="mb-4 text-sm text-gray-600">
        待质检 {{ getPendingSerials(detail).length }} 条，已质检
        {{ getInspections(detail.uid).length }} 条
      </div>

      <el-table
        v-if="(draftMap[detail.uid || ''] || []).length > 0"
        :data="draftMap[detail.uid || ''] || []"
        border
        class="mb-4"
      >
        <el-table-column prop="serialNo" label="胎号" min-width="160" />
        <el-table-column label="质检结果" min-width="140">
          <template #default="{ row }">
            <el-select v-model="row.result" class="w-full">
              <el-option label="良品退回" value="GOOD_RETURN" />
              <el-option label="不良" value="DEFECTIVE" />
              <el-option label="报废" value="SCRAPPED" />
            </el-select>
          </template>
        </el-table-column>
        <el-table-column label="缺陷类别" min-width="160">
          <template #default="{ row }">
            <el-select v-model="row.defectCategoryId" clearable class="w-full">
              <el-option
                v-for="item in defectCategoryOptions"
                :key="item.id"
                :label="item.name"
                :value="item.id"
              />
            </el-select>
          </template>
        </el-table-column>
        <el-table-column label="检测人" min-width="120">
          <template #default="{ row }">
            <el-input v-model="row.inspectedBy" placeholder="可选" />
          </template>
        </el-table-column>
        <el-table-column label="备注" min-width="180">
          <template #default="{ row }">
            <el-input v-model="row.remark" placeholder="可选" />
          </template>
        </el-table-column>
      </el-table>

      <div class="mb-4">
        <el-button
          type="primary"
          :loading="saving"
          :disabled="(draftMap[detail.uid || ''] || []).length === 0"
          @click="saveDetail(detail)"
        >
          保存当前明细质检
        </el-button>
      </div>

      <el-table v-loading="loading" :data="getInspections(detail.uid)" border>
        <el-table-column prop="serialNo" label="胎号" min-width="160" />
        <el-table-column label="质检结果" min-width="120">
          <template #default="{ row }">
            {{ getResultLabel(row.result) }}
          </template>
        </el-table-column>
        <el-table-column
          prop="defectCategory.name"
          label="缺陷类别"
          min-width="140"
        />
        <el-table-column prop="inspectedBy" label="检测人" min-width="120" />
        <el-table-column prop="remark" label="备注" min-width="180" />
      </el-table>
    </el-card>
  </div>
</template>
