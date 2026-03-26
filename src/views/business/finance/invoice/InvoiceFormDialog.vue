<script setup lang="ts">
import { computed, reactive, ref, watch } from "vue";
import type {
  InvoiceBusinessType,
  PurchaseInboundSource,
  SaleDeliverySource,
  SaleDeliverySourceLine
} from "@/api/business/invoice";
import {
  createInvoice,
  getPurchaseInboundSources,
  getSaleDeliverySources
} from "@/api/business/invoice";
import { handleApiError } from "@/utils/error";
import { message } from "@/utils/message";

const props = defineProps<{
  modelValue: boolean;
  preset?: {
    businessType?: InvoiceBusinessType;
    deliveryNoteId?: string;
    purchaseInboundId?: string;
  } | null;
}>();

const emit = defineEmits<{
  (e: "update:modelValue", value: boolean): void;
  (e: "success"): void;
}>();

const dialogVisible = computed({
  get: () => props.modelValue,
  set: value => emit("update:modelValue", value)
});

const loading = ref(false);
const saleDeliveryOptions = ref<SaleDeliverySource[]>([]);
const purchaseInboundOptions = ref<PurchaseInboundSource[]>([]);
const selectedDeliveryLineIds = ref<string[]>([]);

const form = reactive({
  businessType: "SALE" as InvoiceBusinessType,
  deliveryNoteId: "",
  purchaseInboundId: "",
  invoiceNumber: "",
  invoiceType: "vat_normal",
  invoiceDate: new Date().toISOString().slice(0, 10),
  amount: 0,
  taxAmount: 0,
  totalAmount: 0,
  remark: ""
});

const sourceLabel = computed(() => {
  if (form.businessType === "PURCHASE") return "入库单";
  return "发货单";
});

const sourcePlaceholder = computed(() =>
  form.businessType === "PURCHASE" ? "请选择待收票入库单" : "请选择待开票发货单"
);

const currentSaleDelivery = computed(
  () =>
    saleDeliveryOptions.value.find(item => item.uid === form.deliveryNoteId) ||
    null
);

const selectedDeliveryLines = computed(() => {
  const lineMap = new Map(
    (currentSaleDelivery.value?.lines || []).map(line => [line.uid, line])
  );
  return selectedDeliveryLineIds.value
    .map(uid => lineMap.get(uid))
    .filter((line): line is SaleDeliverySourceLine => !!line);
});

async function loadSaleDeliveries() {
  const { data } = await getSaleDeliverySources();
  saleDeliveryOptions.value = data || [];
}

async function loadPurchaseInbounds() {
  const { data } = await getPurchaseInboundSources();
  purchaseInboundOptions.value = data || [];
}

function resetForm() {
  form.deliveryNoteId = "";
  form.purchaseInboundId = "";
  form.invoiceNumber = "";
  form.invoiceType = "vat_normal";
  form.invoiceDate = new Date().toISOString().slice(0, 10);
  form.amount = 0;
  form.taxAmount = 0;
  form.totalAmount = 0;
  form.remark = "";
  selectedDeliveryLineIds.value = [];
}

async function prepareDialog() {
  form.businessType = props.preset?.businessType || "SALE";
  if (form.businessType === "PURCHASE") {
    await loadPurchaseInbounds();
    form.purchaseInboundId = props.preset?.purchaseInboundId || "";
    form.deliveryNoteId = "";
    return;
  }
  await loadSaleDeliveries();
  form.deliveryNoteId = props.preset?.deliveryNoteId || "";
  form.purchaseInboundId = "";
  syncSelectedDeliveryLines();
}

function syncSelectedDeliveryLines() {
  selectedDeliveryLineIds.value = (currentSaleDelivery.value?.lines || [])
    .filter(line => line.remainingAmount > 0)
    .map(line => line.uid);
}

function syncAmountsFromSelectedLines() {
  if (form.businessType !== "SALE") return;
  const totalAmount = selectedDeliveryLines.value.reduce(
    (sum, line) => sum + Number(line.remainingAmount || 0),
    0
  );
  form.totalAmount = totalAmount;
  form.amount = totalAmount;
  form.taxAmount = 0;
}

watch(
  () => dialogVisible.value,
  async visible => {
    if (!visible) return;
    resetForm();
    await prepareDialog();
  }
);

watch(
  () => form.businessType,
  async () => {
    if (!dialogVisible.value) return;
    form.deliveryNoteId = "";
    form.purchaseInboundId = "";
    if (form.businessType === "PURCHASE") {
      await loadPurchaseInbounds();
      return;
    }
    await loadSaleDeliveries();
    syncSelectedDeliveryLines();
  }
);

watch(
  () => form.deliveryNoteId,
  () => {
    if (form.businessType !== "SALE") return;
    syncSelectedDeliveryLines();
  }
);

watch(
  [currentSaleDelivery, selectedDeliveryLineIds],
  () => {
    syncAmountsFromSelectedLines();
  },
  { deep: true }
);

async function handleSubmit() {
  loading.value = true;
  try {
    await createInvoice({
      businessType: form.businessType,
      ...(form.businessType === "PURCHASE"
        ? { purchaseInboundId: form.purchaseInboundId }
        : {
            deliveryNoteId: form.deliveryNoteId,
            deliveryLineLinks: selectedDeliveryLines.value.map(line => ({
              saleDeliveryNoteLineUid: line.uid,
              quantity: line.remainingQuantity,
              amount: Number(line.remainingAmount || 0),
              taxAmount: 0,
              totalAmount: Number(line.remainingAmount || 0)
            }))
          }),
      invoiceNumber: form.invoiceNumber,
      invoiceType: form.invoiceType,
      invoiceDate: form.invoiceDate,
      amount: Number(form.amount || 0),
      taxAmount: Number(form.taxAmount || 0),
      totalAmount: Number(form.totalAmount || 0),
      ...(form.remark ? { remark: form.remark } : {})
    });
    message("发票已创建", { type: "success" });
    dialogVisible.value = false;
    emit("success");
  } catch (error) {
    handleApiError(error, "创建发票失败");
  } finally {
    loading.value = false;
  }
}
</script>

<template>
  <el-dialog
    v-model="dialogVisible"
    title="新建发票"
    width="640px"
    :close-on-click-modal="false"
  >
    <el-form label-width="100px">
      <el-form-item label="业务类型">
        <el-select v-model="form.businessType">
          <el-option label="销售销项" value="SALE" />
          <el-option label="采购进项" value="PURCHASE" />
        </el-select>
      </el-form-item>
      <el-form-item :label="sourceLabel">
        <el-select
          v-if="form.businessType === 'SALE'"
          v-model="form.deliveryNoteId"
          filterable
          class="w-full"
          :placeholder="sourcePlaceholder"
        >
          <el-option
            v-for="item in saleDeliveryOptions"
            :key="item.uid"
            :label="`${item.deliveryNoteNo} / ${item.customerName}`"
            :value="item.uid"
          />
        </el-select>
        <el-select
          v-else
          v-model="form.purchaseInboundId"
          filterable
          class="w-full"
          :placeholder="sourcePlaceholder"
        >
          <el-option
            v-for="item in purchaseInboundOptions"
            :key="item.uid"
            :label="`${item.docNo} / ${item.providerName}`"
            :value="item.uid"
          />
        </el-select>
      </el-form-item>
      <el-form-item v-if="form.businessType === 'SALE'" label="发货行">
        <el-checkbox-group
          v-model="selectedDeliveryLineIds"
          class="grid w-full grid-cols-1 gap-2"
        >
          <el-checkbox
            v-for="line in currentSaleDelivery?.lines || []"
            :key="line.uid"
            :label="line.uid"
            :disabled="line.remainingAmount <= 0"
          >
            {{ line.uid.slice(0, 8) }} / 余量 {{ line.remainingQuantity }} /
            余额
            {{ line.remainingAmount }}
          </el-checkbox>
        </el-checkbox-group>
      </el-form-item>
      <el-form-item label="发票号">
        <el-input v-model="form.invoiceNumber" />
      </el-form-item>
      <el-form-item label="发票类型">
        <el-select v-model="form.invoiceType">
          <el-option label="增值税普通发票" value="vat_normal" />
          <el-option label="增值税专用发票" value="vat_special" />
        </el-select>
      </el-form-item>
      <el-form-item label="开票日期">
        <el-input v-model="form.invoiceDate" />
      </el-form-item>
      <el-form-item label="金额">
        <el-input
          v-model="form.amount"
          :disabled="form.businessType === 'SALE'"
        />
      </el-form-item>
      <el-form-item label="税额">
        <el-input
          v-model="form.taxAmount"
          :disabled="form.businessType === 'SALE'"
        />
      </el-form-item>
      <el-form-item label="价税合计">
        <el-input
          v-model="form.totalAmount"
          :disabled="form.businessType === 'SALE'"
        />
      </el-form-item>
      <el-form-item label="备注">
        <el-input v-model="form.remark" type="textarea" />
      </el-form-item>
    </el-form>

    <template #footer>
      <el-button :disabled="loading" @click="dialogVisible = false">
        取消
      </el-button>
      <el-button type="primary" :loading="loading" @click="handleSubmit">
        创建
      </el-button>
    </template>
  </el-dialog>
</template>
