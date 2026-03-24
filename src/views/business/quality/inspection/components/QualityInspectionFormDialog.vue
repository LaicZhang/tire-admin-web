<script setup lang="ts">
import { onMounted, reactive, ref } from "vue";
import { getPurchaseOrderApi, getPurchaseOrderListApi } from "@/api/purchase";
import { message } from "@/utils";
import type {
  CreateQualityInspectionDto,
  InspectionResult
} from "@/api/business/quality";

interface FormModel extends CreateQualityInspectionDto {}

interface OrderOption {
  uid: string;
  label: string;
}

interface OrderLike {
  uid?: string;
  number?: string | null;
  docNo?: string | null;
}

interface DetailOption {
  detailId: number;
  label: string;
  count: number;
}

const formRef = ref();
const form = reactive<FormModel>({
  purchaseOrderUid: "",
  detailId: undefined,
  inspectedQty: 0,
  qualifiedQty: 0,
  unqualifiedQty: 0,
  result: "PASS",
  handler: "",
  inspectedAt: new Date().toISOString(),
  remark: ""
});
const orderOptions = ref<OrderOption[]>([]);
const detailOptions = ref<DetailOption[]>([]);
const loadingOrders = ref(false);
const loadingDetails = ref(false);

const resultOptions: Array<{ label: string; value: InspectionResult }> = [
  { label: "合格", value: "PASS" },
  { label: "部分合格", value: "PARTIAL" },
  { label: "不合格", value: "FAIL" }
];

const rules = {
  purchaseOrderUid: [
    { required: true, message: "请选择采购订单", trigger: "change" }
  ],
  inspectedAt: [
    { required: true, message: "请选择检验时间", trigger: "change" }
  ]
};

function normalizeOrderLabel(order: OrderLike) {
  const number = String(order.number ?? order.docNo ?? "").trim();
  const uid = String(order.uid ?? "").trim();
  if (number && uid) return `${number} (${uid})`;
  return number || uid;
}

function normalizeDetailOptions(details: unknown): DetailOption[] {
  if (!Array.isArray(details)) return [];
  return details
    .filter((item): item is Record<string, unknown> => {
      return typeof item === "object" && item !== null;
    })
    .map(item => {
      const detailId = Number(item.detailId ?? item.id);
      const tireName = String(item.tireName ?? item.tireId ?? "").trim();
      const count = Number(item.count ?? 0);
      const repo = String(item.repoName ?? item.repoId ?? "").trim();
      return {
        detailId,
        count: Number.isFinite(count) ? count : 0,
        label: [tireName || `明细#${detailId}`, `数量:${count}`, repo]
          .filter(Boolean)
          .join(" · ")
      };
    })
    .filter(item => Number.isInteger(item.detailId) && item.detailId > 0);
}

function resetDetailSelection() {
  detailOptions.value = [];
  form.detailId = undefined;
  form.inspectedQty = 0;
  form.qualifiedQty = 0;
  form.unqualifiedQty = 0;
}

function applySelectedDetail(detailId: number | undefined) {
  const detail = detailOptions.value.find(item => item.detailId === detailId);
  const count = detail?.count ?? 0;
  form.inspectedQty = count;
  if (form.result === "PASS") {
    form.qualifiedQty = count;
    form.unqualifiedQty = 0;
  }
}

async function loadOrderOptions() {
  loadingOrders.value = true;
  try {
    const { code, data, msg } = await getPurchaseOrderListApi(1, {
      isApproved: true,
      pageSize: 100
    });
    if (code !== 200) {
      message(msg || "加载采购订单失败", { type: "error" });
      orderOptions.value = [];
      return;
    }
    const list = Array.isArray(data?.list) ? data.list : [];
    orderOptions.value = list
      .map(item => ({
        uid: String(item.uid ?? "").trim(),
        label: normalizeOrderLabel(item)
      }))
      .filter(item => item.uid && item.label);
  } catch (error) {
    orderOptions.value = [];
    const msg = error instanceof Error ? error.message : "加载采购订单失败";
    message(msg, { type: "error" });
  } finally {
    loadingOrders.value = false;
  }
}

async function handlePurchaseOrderChange(value: string | undefined) {
  form.purchaseOrderUid = value ?? "";
  resetDetailSelection();
  if (!value) return;

  loadingDetails.value = true;
  try {
    const { code, data, msg } = await getPurchaseOrderApi(value);
    if (code !== 200) {
      message(msg || "加载采购订单明细失败", { type: "error" });
      return;
    }
    detailOptions.value = normalizeDetailOptions(data?.details);
  } catch (error) {
    const msg = error instanceof Error ? error.message : "加载采购订单明细失败";
    message(msg, { type: "error" });
  } finally {
    loadingDetails.value = false;
  }
}

function handleDetailChange(value: string | number) {
  const detailId = Number(value);
  form.detailId =
    Number.isInteger(detailId) && detailId > 0 ? detailId : undefined;
  applySelectedDetail(form.detailId);
}

function isNonNegativeInteger(value: number) {
  return Number.isInteger(value) && value >= 0;
}

function validateQuantities() {
  if (
    ![form.inspectedQty, form.qualifiedQty, form.unqualifiedQty].every(
      isNonNegativeInteger
    )
  ) {
    message("检验数量、合格数量和不合格数量都必须是不小于 0 的整数", {
      type: "warning"
    });
    return false;
  }
  if (form.qualifiedQty + form.unqualifiedQty !== form.inspectedQty) {
    message("需满足 检验数量 = 合格数量 + 不合格数量", {
      type: "warning"
    });
    return false;
  }
  if (form.result === "PASS" && form.unqualifiedQty !== 0) {
    message("合格结果下，不合格数量必须为 0", { type: "warning" });
    return false;
  }
  if (form.result === "FAIL" && form.qualifiedQty !== 0) {
    message("不合格结果下，合格数量必须为 0", { type: "warning" });
    return false;
  }
  if (
    form.result === "PARTIAL" &&
    (form.qualifiedQty === 0 || form.unqualifiedQty === 0)
  ) {
    message("部分合格结果下，合格与不合格数量都必须大于 0", {
      type: "warning"
    });
    return false;
  }
  return true;
}

async function validate() {
  const valid = await formRef.value?.validate().catch(() => false);
  return !!valid && validateQuantities();
}

function getPayload(): CreateQualityInspectionDto {
  const handler = form.handler?.trim();
  const remark = form.remark?.trim();
  return {
    purchaseOrderUid: form.purchaseOrderUid.trim(),
    ...(form.detailId ? { detailId: form.detailId } : {}),
    inspectedQty: form.inspectedQty,
    qualifiedQty: form.qualifiedQty,
    unqualifiedQty: form.unqualifiedQty,
    result: form.result,
    ...(handler ? { handler } : {}),
    inspectedAt: form.inspectedAt,
    ...(remark ? { remark } : {})
  };
}

defineExpose({
  validate,
  getPayload
});

onMounted(() => {
  void loadOrderOptions();
});
</script>

<template>
  <el-form ref="formRef" :model="form" :rules="rules" label-width="108px">
    <el-form-item label="采购订单" prop="purchaseOrderUid">
      <el-select
        v-model="form.purchaseOrderUid"
        placeholder="请选择采购订单"
        filterable
        clearable
        class="w-full"
        :loading="loadingOrders"
        @change="handlePurchaseOrderChange"
      >
        <el-option
          v-for="item in orderOptions"
          :key="item.uid"
          :label="item.label"
          :value="item.uid"
        />
      </el-select>
    </el-form-item>

    <el-form-item label="采购明细">
      <el-select
        v-model="form.detailId"
        placeholder="请选择采购明细"
        clearable
        class="w-full"
        :loading="loadingDetails"
        :disabled="!form.purchaseOrderUid"
        @change="handleDetailChange"
      >
        <el-option
          v-for="item in detailOptions"
          :key="item.detailId"
          :label="item.label"
          :value="item.detailId"
        />
      </el-select>
    </el-form-item>

    <div class="grid grid-cols-2 gap-3">
      <el-form-item label="检验数量">
        <el-input-number
          v-model="form.inspectedQty"
          :min="0"
          :precision="0"
          class="w-full"
        />
      </el-form-item>

      <el-form-item label="合格数量">
        <el-input-number
          v-model="form.qualifiedQty"
          :min="0"
          :precision="0"
          class="w-full"
        />
      </el-form-item>

      <el-form-item label="不合格数量">
        <el-input-number
          v-model="form.unqualifiedQty"
          :min="0"
          :precision="0"
          class="w-full"
        />
      </el-form-item>

      <el-form-item label="检验结果">
        <el-select v-model="form.result" class="w-full">
          <el-option
            v-for="item in resultOptions"
            :key="item.value"
            :label="item.label"
            :value="item.value"
          />
        </el-select>
      </el-form-item>
    </div>

    <el-form-item label="处理方式">
      <el-input v-model="form.handler" placeholder="可选" />
    </el-form-item>

    <el-form-item label="检验时间" prop="inspectedAt">
      <el-date-picker
        v-model="form.inspectedAt"
        type="datetime"
        value-format="YYYY-MM-DDTHH:mm:ss[Z]"
        class="w-full"
      />
    </el-form-item>

    <el-form-item label="备注">
      <el-input
        v-model="form.remark"
        type="textarea"
        maxlength="200"
        show-word-limit
      />
    </el-form-item>
  </el-form>
</template>
