<script setup lang="ts">
import { computed, reactive, ref, watch } from "vue";
import type { InvoiceBusinessType } from "@/api/business/invoice";
import { createInvoice } from "@/api/business/invoice";
import { getStatementList, type Statement } from "@/api/business/statement";
import { handleApiError } from "@/utils/error";
import { message } from "@/utils/message";

const props = defineProps<{
  modelValue: boolean;
  preset?: {
    businessType?: InvoiceBusinessType;
    statementId?: string;
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
const statementOptions = ref<Statement[]>([]);
const statementSelectOptions = computed(() =>
  statementOptions.value.filter(
    (item): item is Statement & { uid: string } =>
      typeof item.uid === "string" && item.uid.length > 0
  )
);

const form = reactive({
  businessType: "SALE" as InvoiceBusinessType,
  statementId: "",
  invoiceNumber: "",
  invoiceType: "vat_normal",
  invoiceDate: new Date().toISOString().slice(0, 10),
  amount: 0,
  taxAmount: 0,
  totalAmount: 0,
  remark: ""
});

const statementType = computed(() =>
  form.businessType === "PURCHASE" ? "PROVIDER" : "CUSTOMER"
);

async function loadStatements() {
  const { data } = await getStatementList({
    page: 1,
    pageSize: 100,
    type: statementType.value
  });
  statementOptions.value = data?.list || [];
}

function resetForm() {
  form.statementId = "";
  form.invoiceNumber = "";
  form.invoiceType = "vat_normal";
  form.invoiceDate = new Date().toISOString().slice(0, 10);
  form.amount = 0;
  form.taxAmount = 0;
  form.totalAmount = 0;
  form.remark = "";
}

async function prepareDialog() {
  form.businessType = props.preset?.businessType || "SALE";
  await loadStatements();
  form.statementId = props.preset?.statementId || "";
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
    form.statementId = "";
    await loadStatements();
  }
);

async function handleSubmit() {
  loading.value = true;
  try {
    await createInvoice({
      businessType: form.businessType,
      statementId: form.statementId,
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
      <el-form-item label="对账单">
        <el-select v-model="form.statementId" filterable class="w-full">
          <el-option
            v-for="item in statementSelectOptions"
            :key="item.uid"
            :label="`${item.statementNo} / ${item.targetName}`"
            :value="item.uid"
          />
        </el-select>
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
        <el-input v-model="form.amount" />
      </el-form-item>
      <el-form-item label="税额">
        <el-input v-model="form.taxAmount" />
      </el-form-item>
      <el-form-item label="价税合计">
        <el-input v-model="form.totalAmount" />
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
