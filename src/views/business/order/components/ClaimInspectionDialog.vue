<script setup lang="ts">
import { onMounted, reactive, ref } from "vue";
import ProviderSelect from "@/components/EntitySelect/ProviderSelect.vue";
import {
  createClaimInspectionApi,
  getClaimDefectCategoryListApi,
  getClaimInspectionListApi
} from "@/api";
import { message } from "@/utils";

type ClaimInspectionRow = {
  uid?: string;
  inspectedBy?: string;
  result?: string;
  remark?: string;
  lossAmount?: number;
  responsibilityRatio?: number;
  defectCategory?: { name?: string };
  linkedProvider?: { name?: string };
  createdAt?: string;
};

type DefectCategoryOption = {
  id: number;
  name: string;
};

const props = defineProps<{
  orderUid: string;
}>();

const loading = ref(false);
const saving = ref(false);
const rows = ref<ClaimInspectionRow[]>([]);
const defectCategoryOptions = ref<DefectCategoryOption[]>([]);
const form = reactive({
  inspectedBy: "",
  result: "",
  remark: "",
  defectCategoryId: undefined as number | undefined,
  lossAmount: 0,
  linkedProviderId: "",
  responsibilityRatio: 100
});

async function loadBaseData() {
  loading.value = true;
  try {
    const [
      { code: inspectionCode, data: inspectionData, msg: inspectionMsg },
      { code: categoryCode, data: categoryData, msg: categoryMsg }
    ] = await Promise.all([
      getClaimInspectionListApi(props.orderUid),
      getClaimDefectCategoryListApi()
    ]);

    if (inspectionCode !== 200) {
      message(inspectionMsg || "加载检测记录失败", { type: "error" });
      return;
    }
    if (categoryCode !== 200) {
      message(categoryMsg || "加载缺陷类别失败", { type: "error" });
      return;
    }

    rows.value = Array.isArray(inspectionData) ? inspectionData : [];
    defectCategoryOptions.value = Array.isArray(categoryData)
      ? categoryData
      : [];
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "加载检测记录失败";
    message(msg, { type: "error" });
  } finally {
    loading.value = false;
  }
}

async function createInspection() {
  if (!form.result.trim()) {
    message("请输入检测结果", { type: "warning" });
    return;
  }
  saving.value = true;
  try {
    const { code, msg } = await createClaimInspectionApi(props.orderUid, {
      inspectedBy: form.inspectedBy.trim() || undefined,
      result: form.result.trim(),
      remark: form.remark.trim() || undefined,
      defectCategoryId: form.defectCategoryId,
      lossAmount: Number(form.lossAmount) || undefined,
      linkedProviderId: form.linkedProviderId || undefined,
      responsibilityRatio: Number(form.responsibilityRatio) || 0
    });
    if (code !== 200) {
      message(msg || "新增检测记录失败", { type: "error" });
      return;
    }
    message("检测记录已保存", { type: "success" });
    form.inspectedBy = "";
    form.result = "";
    form.remark = "";
    form.defectCategoryId = undefined;
    form.lossAmount = 0;
    form.linkedProviderId = "";
    form.responsibilityRatio = 100;
    await loadBaseData();
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "新增检测记录失败";
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
    <el-card shadow="never">
      <template #header>
        <div class="font-medium">新增检测记录</div>
      </template>
      <el-form label-width="110px">
        <el-form-item label="检测人">
          <el-input v-model="form.inspectedBy" placeholder="可选" />
        </el-form-item>
        <el-form-item label="检测结果" required>
          <el-input
            v-model="form.result"
            type="textarea"
            placeholder="请输入检测结果"
          />
        </el-form-item>
        <el-form-item label="缺陷类别">
          <el-select v-model="form.defectCategoryId" clearable class="w-full">
            <el-option
              v-for="item in defectCategoryOptions"
              :key="item.id"
              :label="item.name"
              :value="item.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="责任比例(%)">
          <el-input-number
            v-model="form.responsibilityRatio"
            :min="0"
            :max="100"
            controls-position="right"
          />
        </el-form-item>
        <el-form-item label="损失金额">
          <el-input-number
            v-model="form.lossAmount"
            :min="0"
            :precision="2"
            controls-position="right"
          />
        </el-form-item>
        <el-form-item label="关联供应商">
          <ProviderSelect
            v-model="form.linkedProviderId"
            placeholder="可选"
            class="w-full"
          />
        </el-form-item>
        <el-form-item label="备注">
          <el-input v-model="form.remark" type="textarea" placeholder="可选" />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" :loading="saving" @click="createInspection">
            保存
          </el-button>
          <el-button :loading="loading" @click="loadBaseData"
            >刷新列表</el-button
          >
        </el-form-item>
      </el-form>
    </el-card>

    <el-card shadow="never">
      <template #header>
        <div class="font-medium">检测记录列表</div>
      </template>
      <el-table v-loading="loading" :data="rows" border>
        <el-table-column prop="inspectedBy" label="检测人" min-width="120" />
        <el-table-column prop="result" label="检测结果" min-width="240" />
        <el-table-column
          prop="defectCategory.name"
          label="缺陷类别"
          min-width="140"
        />
        <el-table-column
          prop="responsibilityRatio"
          label="责任比例"
          min-width="100"
        >
          <template #default="{ row }">
            {{ row.responsibilityRatio ?? 100 }}%
          </template>
        </el-table-column>
        <el-table-column prop="lossAmount" label="损失金额" min-width="100" />
        <el-table-column
          prop="linkedProvider.name"
          label="关联供应商"
          min-width="140"
        />
        <el-table-column prop="remark" label="备注" min-width="180" />
      </el-table>
    </el-card>
  </div>
</template>
