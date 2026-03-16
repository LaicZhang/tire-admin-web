<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from "vue";
import type { FormInstance, FormRules } from "element-plus";
import dayjs from "dayjs";
import { handleApiError, message } from "@/utils";
import { fenToYuan } from "@/utils/formatMoney";
import {
  createReceiptApi,
  updateReceiptApi,
  type CreateReceiptDto
} from "@/api/fund/receipt";
import {
  PAYMENT_METHOD_OPTIONS,
  type PaymentMethod,
  type ReceiptDetailItem,
  type ReceiptOrder
} from "./types";
import { useFundForm } from "../composables/useFundForm";
import { loadSettlementDefaults } from "@/composables";
import { logger } from "@/utils/logger";

const props = defineProps<{
  editData?: ReceiptOrder | null;
  initialValues?: {
    customerId?: string;
    amount?: number;
    remark?: string;
  };
}>();

const formRef = ref<FormInstance>();
const { customerList, paymentList, loadCustomers, loadPayments } =
  useFundForm();

const formData = reactive<CreateReceiptDto & { details: ReceiptDetailItem[] }>({
  customerId: "",
  paymentId: "",
  amount: 0,
  paymentMethod: "BANK_TRANSFER",
  receiptDate: dayjs().format("YYYY-MM-DD"),
  remark: "",
  details: []
});

const rules: FormRules = {
  customerId: [{ required: true, message: "请选择客户", trigger: "change" }],
  paymentId: [{ required: true, message: "请选择结算账户", trigger: "change" }],
  amount: [
    { required: true, message: "请输入收款金额", trigger: "blur" },
    { type: "number", min: 0.01, message: "收款金额必须大于0", trigger: "blur" }
  ]
};

const totalWriteOffAmount = computed(() => {
  return formData.details.reduce(
    (sum, item) => sum + (item.writeOffAmount || 0),
    0
  );
});

const advanceAmount = computed(() => {
  return Math.max(0, formData.amount - totalWriteOffAmount.value);
});

function resetForm() {
  Object.assign(formData, {
    customerId: props.initialValues?.customerId || "",
    paymentId: "",
    amount: props.initialValues?.amount || 0,
    paymentMethod: "BANK_TRANSFER" as PaymentMethod,
    receiptDate: dayjs().format("YYYY-MM-DD"),
    remark: props.initialValues?.remark || "",
    details: []
  });
  formRef.value?.resetFields?.();
  void applySettlementDefaults();
}

async function applySettlementDefaults() {
  if (props.editData) return;
  try {
    const defaults = await loadSettlementDefaults();
    if (!formData.paymentId && defaults.defaultReceivableAccount) {
      formData.paymentId = defaults.defaultReceivableAccount;
    }
    if (defaults.defaultPaymentMethod) {
      formData.paymentMethod = defaults.defaultPaymentMethod as PaymentMethod;
    }
  } catch (error) {
    logger.error("[SettlementDefaults] load failed", error);
  }
}

function applyEditData() {
  if (!props.editData) {
    resetForm();
    return;
  }

  Object.assign(formData, {
    customerId: props.editData.customerId,
    paymentId: props.editData.paymentId,
    amount: (props.editData.amount || 0) / 100,
    paymentMethod: props.editData.paymentMethod || "BANK_TRANSFER",
    receiptDate: props.editData.receiptDate || dayjs().format("YYYY-MM-DD"),
    remark: props.editData.remark || "",
    details:
      props.editData.details?.map(detail => ({
        ...detail,
        receivableAmount: (detail.receivableAmount || 0) / 100,
        writeOffAmount: (detail.writeOffAmount || 0) / 100
      })) || []
  });
}

watch(
  () => [props.editData, props.initialValues],
  () => {
    applyEditData();
  },
  { immediate: true, deep: true }
);

async function submit() {
  const valid = await formRef.value?.validate().catch(() => false);
  if (!valid) return false;

  try {
    const submitData = {
      ...formData,
      amount: Math.round(formData.amount * 100),
      details: formData.details.map(detail => ({
        ...detail,
        receivableAmount: Math.round((detail.receivableAmount || 0) * 100),
        writeOffAmount: Math.round((detail.writeOffAmount || 0) * 100)
      }))
    };

    if (props.editData?.uid) {
      await updateReceiptApi(props.editData.uid, submitData);
    } else {
      await createReceiptApi(submitData);
    }

    message(props.editData ? "更新成功" : "创建成功", { type: "success" });
    return true;
  } catch (error) {
    handleApiError(error, "操作失败");
    return false;
  }
}

function addDetailRow() {
  formData.details.push({
    sourceOrderNo: "",
    sourceOrderType: "",
    receivableAmount: 0,
    writeOffAmount: 0,
    remark: ""
  });
}

function removeDetailRow(index: number) {
  formData.details.splice(index, 1);
}

const formColumns: TableColumnList = [
  {
    label: "源单据编号",
    slot: "sourceOrderNo",
    minWidth: 150
  },
  {
    label: "源单据类型",
    slot: "sourceOrderType",
    width: 120
  },
  {
    label: "应收金额",
    slot: "receivableAmount",
    width: 130
  },
  {
    label: "本次核销",
    slot: "writeOffAmount",
    width: 130
  },
  {
    label: "操作",
    width: 80,
    align: "center",
    slot: "operation"
  }
];

defineExpose({ submit });

onMounted(() => {
  loadCustomers();
  loadPayments();
});
</script>

<template>
  <el-form
    ref="formRef"
    :model="formData"
    :rules="rules"
    label-width="100px"
    class="pr-4"
  >
    <el-row :gutter="20">
      <el-col :span="12">
        <el-form-item label="客户" prop="customerId">
          <el-select
            v-model="formData.customerId"
            placeholder="请选择客户"
            filterable
            class="w-full"
          >
            <el-option
              v-for="item in customerList"
              :key="item.uid"
              :label="item.name"
              :value="item.uid"
            />
          </el-select>
        </el-form-item>
      </el-col>
      <el-col :span="12">
        <el-form-item label="结算账户" prop="paymentId">
          <el-select
            v-model="formData.paymentId"
            placeholder="请选择结算账户"
            filterable
            class="w-full"
          >
            <el-option
              v-for="item in paymentList"
              :key="item.uid"
              :label="`${item.name}${item.balance !== undefined ? ` (${fenToYuan(item.balance)})` : ''}`"
              :value="item.uid"
            />
          </el-select>
        </el-form-item>
      </el-col>
    </el-row>

    <el-row :gutter="20">
      <el-col :span="12">
        <el-form-item label="收款金额" prop="amount">
          <el-input-number
            v-model="formData.amount"
            :min="0"
            :precision="2"
            :step="100"
            class="w-full"
            controls-position="right"
          />
        </el-form-item>
      </el-col>
      <el-col :span="12">
        <el-form-item label="收款方式" prop="paymentMethod">
          <el-select
            v-model="formData.paymentMethod"
            placeholder="请选择收款方式"
            class="w-full"
          >
            <el-option
              v-for="item in PAYMENT_METHOD_OPTIONS"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            />
          </el-select>
        </el-form-item>
      </el-col>
    </el-row>

    <el-row :gutter="20">
      <el-col :span="12">
        <el-form-item label="收款日期" prop="receiptDate">
          <el-date-picker
            v-model="formData.receiptDate"
            type="date"
            placeholder="选择日期"
            value-format="YYYY-MM-DD"
            class="w-full"
          />
        </el-form-item>
      </el-col>
      <el-col :span="12">
        <el-form-item label="本次预收">
          <el-input
            :model-value="advanceAmount.toFixed(2)"
            disabled
            class="w-full"
          >
            <template #prefix>¥</template>
          </el-input>
        </el-form-item>
      </el-col>
    </el-row>

    <el-form-item label="备注">
      <el-input
        v-model="formData.remark"
        type="textarea"
        :rows="2"
        placeholder="请输入备注"
        maxlength="200"
        show-word-limit
      />
    </el-form-item>

    <el-divider content-position="left">核销明细</el-divider>

    <div class="mb-4">
      <el-button type="primary" size="small" @click="addDetailRow">
        添加明细
      </el-button>
    </div>

    <pure-table
      :data="formData.details"
      border
      size="small"
      class="mb-4"
      :columns="formColumns"
    >
      <template #sourceOrderNo="{ row }">
        <el-input v-model="row.sourceOrderNo" placeholder="输入单据编号" />
      </template>
      <template #sourceOrderType="{ row }">
        <el-select v-model="row.sourceOrderType" placeholder="选择类型">
          <el-option label="销售订单" value="SALE_ORDER" />
          <el-option label="期初应收" value="INITIAL" />
        </el-select>
      </template>
      <template #receivableAmount="{ row }">
        <el-input-number
          v-model="row.receivableAmount"
          :min="0"
          :precision="2"
          size="small"
          controls-position="right"
        />
      </template>
      <template #writeOffAmount="{ row }">
        <el-input-number
          v-model="row.writeOffAmount"
          :min="0"
          :max="row.receivableAmount"
          :precision="2"
          size="small"
          controls-position="right"
        />
      </template>
      <template #operation="{ index }">
        <el-button
          type="danger"
          size="small"
          link
          @click="removeDetailRow(index)"
        >
          删除
        </el-button>
      </template>
    </pure-table>

    <div class="flex justify-end text-sm text-gray-500">
      核销合计: ¥{{ totalWriteOffAmount.toFixed(2) }}
    </div>
  </el-form>
</template>
