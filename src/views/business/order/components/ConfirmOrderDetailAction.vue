<script setup lang="ts">
import { computed, onMounted, ref, watch } from "vue";
import { getOrderApi } from "@/api/business/order";
import { message } from "@/utils/message";

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
  batchNo?: string;
  productionDate?: string;
  expiryDate?: string;
};

type ConfirmFormState = {
  detailUid: string;
  shipCount: number;
  batchNo: string;
  productionDate: string;
  expiryDate: string;
};

type OrderDetail = {
  uid: string;
  tireId?: string;
  count?: number;
};

const props = defineProps<{
  orderType: string;
  action: Action;
  orderUid: string;
}>();

const loading = ref(false);
const details = ref<OrderDetail[]>([]);

const form = ref<ConfirmFormState>({
  detailUid: "",
  shipCount: 1,
  batchNo: "",
  productionDate: "",
  expiryDate: ""
});

const selectedDetail = computed(() => {
  return details.value.find(d => d.uid === form.value.detailUid);
});

function makeDetailLabel(detail: OrderDetail) {
  const uid = detail.uid ?? "-";
  const tire = detail.tireId ? ` ${detail.tireId}` : "";
  const count = detail.count != null ? ` ×${detail.count}` : "";
  return `${uid}${tire}${count}`;
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
        count: typeof item.count === "number" ? item.count : undefined
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
    if (props.action === "sale-shipment") {
      const count = selectedDetail.value?.count;
      if (count && (!form.value.shipCount || form.value.shipCount <= 0)) {
        form.value.shipCount = count;
      }
    }
  }
);

function getPayload(): ConfirmPayload {
  return {
    detailUid: form.value.detailUid,
    shipCount: form.value.shipCount > 0 ? form.value.shipCount : undefined,
    batchNo: form.value.batchNo.trim() ? form.value.batchNo.trim() : undefined,
    productionDate: form.value.productionDate || undefined,
    expiryDate: form.value.expiryDate || undefined
  };
}

defineExpose({ getPayload });

onMounted(load);
</script>

<template>
  <el-form v-loading="loading" label-width="90px">
    <el-form-item label="明细" required>
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

    <template v-if="props.action === 'sale-shipment'">
      <el-form-item label="发货数量" required>
        <el-input-number v-model="form.shipCount" :min="1" />
      </el-form-item>
    </template>

    <template v-if="props.action === 'purchase-arrival'">
      <el-form-item label="批次号">
        <el-input v-model="form.batchNo" placeholder="可选" />
      </el-form-item>
      <el-form-item label="生产日期">
        <el-date-picker
          v-model="form.productionDate"
          type="date"
          value-format="YYYY-MM-DD"
          placeholder="可选"
        />
      </el-form-item>
      <el-form-item label="过期日期">
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
