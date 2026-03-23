<script setup lang="ts">
import { computed, onMounted, ref, watch } from "vue";
import type { FormInstance, FormRules } from "element-plus";
import { getOrderApi } from "@/api/business/order";
import { message } from "@/utils/message";
import {
  formatSerialNoListText,
  parseSerialNoListText
} from "@/utils/serialNumber";
import { elementRules } from "@/utils/validation/elementRules";

type Action =
  | "purchase-arrival"
  | "sale-shipment"
  | "sale-delivery"
  | "return-arrival"
  | "return-shipment"
  | "return-delivery"
  | "transfer-shipment"
  | "transfer-arrival";

type ConfirmPayload = {
  detailUid: string;
  shipCount?: number;
  serialNos?: string[];
  batchNo?: string;
  productionDate?: string;
  expiryDate?: string;
};

type ConfirmFormState = {
  detailUid: string;
  shipCount: number;
  serialNosText: string;
  batchNo: string;
  productionDate: string;
  expiryDate: string;
};

type SerialProgress = {
  total: number;
  shippedCount: number;
  arrivedCount?: number;
  pendingShipmentSerialNos: string[];
  pendingArrivalSerialNos?: string[];
};

type OrderDetail = {
  uid: string;
  tireId?: string;
  count?: number;
  serialProgress?: SerialProgress;
};

const props = defineProps<{
  orderType: string;
  action: Action;
  orderUid: string;
}>();

const loading = ref(false);
const details = ref<OrderDetail[]>([]);

const formRef = ref<FormInstance>();
const form = ref<ConfirmFormState>({
  detailUid: "",
  shipCount: 1,
  serialNosText: "",
  batchNo: "",
  productionDate: "",
  expiryDate: ""
});

const rules: FormRules = {
  detailUid: [elementRules.requiredSelect("请选择明细", "change")],
  shipCount: [elementRules.positiveInt("请输入有效的发货数量")],
  batchNo: [elementRules.maxLen(50, "批次号最多 50 个字符")],
  productionDate: [
    {
      trigger: "change",
      validator: (_rule, value, callback) => {
        if (!value) return callback();
        const s = typeof value === "string" ? value : String(value);
        if (!/^\d{4}-\d{2}-\d{2}$/.test(s))
          return callback(new Error("生产日期格式不正确"));
        callback();
      }
    }
  ],
  expiryDate: [
    {
      trigger: "change",
      validator: (_rule, value, callback) => {
        if (!value) return callback();
        const s = typeof value === "string" ? value : String(value);
        if (!/^\d{4}-\d{2}-\d{2}$/.test(s))
          return callback(new Error("过期日期格式不正确"));
        const p = form.value.productionDate
          ? new Date(form.value.productionDate).getTime()
          : Number.NaN;
        const e = new Date(s).getTime();
        if (Number.isFinite(p) && Number.isFinite(e) && p > e)
          return callback(new Error("过期日期不能早于生产日期"));
        callback();
      }
    }
  ]
};

const selectedDetail = computed(() => {
  return details.value.find(d => d.uid === form.value.detailUid);
});

const needsSerialSelection = computed(() => {
  if (!selectedDetail.value?.serialProgress?.total) return false;
  return (
    props.action === "sale-shipment" ||
    props.action === "transfer-shipment" ||
    props.action === "transfer-arrival"
  );
});

const currentPendingSerialNos = computed(() => {
  const progress = selectedDetail.value?.serialProgress;
  if (!progress) return [];
  if (props.action === "transfer-arrival")
    return progress.pendingArrivalSerialNos || [];
  return progress.pendingShipmentSerialNos || [];
});

function makeDetailLabel(detail: OrderDetail) {
  const uid = detail.uid ?? "-";
  const tire = detail.tireId ? ` ${detail.tireId}` : "";
  const count = detail.count != null ? ` ×${detail.count}` : "";
  const pending = detail.serialProgress
    ? ` 待处理:${
        props.action === "transfer-arrival"
          ? detail.serialProgress.pendingArrivalSerialNos?.length || 0
          : detail.serialProgress.pendingShipmentSerialNos.length
      }`
    : "";
  return `${uid}${tire}${count}${pending}`;
}

async function load() {
  loading.value = true;
  try {
    const { code, data, msg } = await getOrderApi(
      props.orderType,
      props.orderUid
    );
    if (code !== 200) {
      message(msg || "加载订单详情失败", { type: "error" });
      details.value = [];
      return;
    }

    const order = data as { details?: unknown };
    const raw = Array.isArray(order.details) ? order.details : [];
    details.value = raw
      .filter((item): item is Record<string, unknown> => {
        return typeof item === "object" && item !== null;
      })
      .map(item => ({
        uid: typeof item.uid === "string" ? item.uid : "",
        tireId: typeof item.tireId === "string" ? item.tireId : undefined,
        count: typeof item.count === "number" ? item.count : undefined,
        serialProgress:
          typeof item.serialProgress === "object" &&
          item.serialProgress !== null
            ? (item.serialProgress as SerialProgress)
            : undefined
      }))
      .filter(item => Boolean(item.uid));

    if (!form.value.detailUid && details.value.length > 0) {
      form.value.detailUid = details.value[0].uid ?? "";
    }
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "加载订单详情失败";
    message(msg, { type: "error" });
  } finally {
    loading.value = false;
  }
}

watch(
  () => form.value.detailUid,
  () => {
    if (needsSerialSelection.value) {
      form.value.serialNosText = formatSerialNoListText(
        currentPendingSerialNos.value
      );
    }
    if (props.action === "sale-shipment" && !needsSerialSelection.value) {
      const count = selectedDetail.value?.count;
      if (count && (!form.value.shipCount || form.value.shipCount <= 0)) {
        form.value.shipCount = count;
      }
    }
  }
);

function getPayload(): ConfirmPayload {
  const serialNos = needsSerialSelection.value
    ? parseSerialNoListText(form.value.serialNosText)
    : [];
  return {
    detailUid: form.value.detailUid,
    shipCount:
      props.action === "sale-shipment" &&
      !needsSerialSelection.value &&
      form.value.shipCount > 0
        ? form.value.shipCount
        : undefined,
    serialNos: serialNos.length > 0 ? serialNos : undefined,
    batchNo: form.value.batchNo.trim() ? form.value.batchNo.trim() : undefined,
    productionDate: form.value.productionDate || undefined,
    expiryDate: form.value.expiryDate || undefined
  };
}

async function validate(): Promise<boolean> {
  if (
    needsSerialSelection.value &&
    parseSerialNoListText(form.value.serialNosText).length === 0
  ) {
    message("请录入本次确认的胎号", { type: "warning" });
    return false;
  }
  const ok = await formRef.value?.validate().catch(() => false);
  if (!ok) message("请检查表单填写", { type: "warning" });
  return !!ok;
}

defineExpose({ getPayload, validate });

onMounted(load);
</script>

<template>
  <el-form
    ref="formRef"
    v-loading="loading"
    :model="form"
    :rules="rules"
    label-width="90px"
  >
    <el-form-item label="明细" prop="detailUid">
      <el-select
        v-model="form.detailUid"
        class="w-full"
        placeholder="请选择明细"
      >
        <el-option
          v-for="d in details"
          :key="d.uid"
          :label="makeDetailLabel(d)"
          :value="d.uid"
        />
      </el-select>
    </el-form-item>

    <template v-if="props.action === 'sale-shipment' && !needsSerialSelection">
      <el-form-item label="发货数量" prop="shipCount">
        <el-input-number v-model="form.shipCount" :min="1" />
      </el-form-item>
    </template>

    <template v-if="needsSerialSelection">
      <el-form-item label="待处理胎号">
        <el-input
          :model-value="formatSerialNoListText(currentPendingSerialNos)"
          type="textarea"
          :rows="4"
          readonly
        />
      </el-form-item>
      <el-form-item label="本次胎号">
        <el-input
          v-model="form.serialNosText"
          type="textarea"
          :rows="5"
          placeholder="每行一个胎号"
        />
      </el-form-item>
    </template>

    <template v-if="props.action === 'purchase-arrival'">
      <el-form-item label="批次号" prop="batchNo">
        <el-input
          v-model="form.batchNo"
          placeholder="可选"
          maxlength="50"
          show-word-limit
          clearable
        />
      </el-form-item>
      <el-form-item label="生产日期" prop="productionDate">
        <el-date-picker
          v-model="form.productionDate"
          type="date"
          value-format="YYYY-MM-DD"
          placeholder="可选"
        />
      </el-form-item>
      <el-form-item label="过期日期" prop="expiryDate">
        <el-date-picker
          v-model="form.expiryDate"
          type="date"
          value-format="YYYY-MM-DD"
          placeholder="可选"
        />
      </el-form-item>
    </template>
  </el-form>
</template>
