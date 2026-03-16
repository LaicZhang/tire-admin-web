<script setup lang="ts">
import { computed, onMounted, reactive, ref } from "vue";
import type { FormInstance, FormRules } from "element-plus";
import {
  PAYMENT_METHOD_OPTIONS,
  type PaymentOrder,
  type CreatePaymentOrderDto,
  type PaymentMethod,
  type PaymentDetailItem
} from "./types";
import dayjs from "dayjs";
import { fenToYuan, fenToYuanNumber } from "@/utils/formatMoney";
import { handleApiError, message } from "@/utils";
import { useFundForm } from "../composables/useFundForm";
import {
  createPaymentOrderApi,
  updatePaymentOrderApi
} from "@/api/fund/payment-order";
import { loadSettlementDefaults } from "@/composables";
import { logger } from "@/utils/logger";

const props = defineProps<{
  editData?: PaymentOrder | null;
  initialValues?: {
    providerId?: string;
    amount?: number;
    remark?: string;
  };
}>();

const formRef = ref<FormInstance>();

const { providerList, paymentList, loadProviders, loadPayments } =
  useFundForm();

const formData = reactive<
  CreatePaymentOrderDto & { details: PaymentDetailItem[] }
>({
  providerId: "",
  paymentId: "",
  amount: 0,
  paymentMethod: "BANK_TRANSFER",
  paymentDate: dayjs().format("YYYY-MM-DD"),
  remark: "",
  details: []
});

const rules: FormRules = {
  providerId: [{ required: true, message: "请选择供应商", trigger: "change" }],
  paymentId: [{ required: true, message: "请选择结算账户", trigger: "change" }],
  amount: [
    { required: true, message: "请输入付款金额", trigger: "blur" },
    {
      type: "number",
      min: 0.01,
      message: "付款金额必须大于0",
      trigger: "blur"
    }
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

const selectedPaymentBalance = computed(() => {
  const selected = paymentList.value.find(p => p.uid === formData.paymentId);
  return selected?.balance !== undefined
    ? fenToYuanNumber(selected.balance)
    : null;
});

function resetForm() {
  formRef.value?.resetFields?.();
  Object.assign(formData, {
    providerId: props.initialValues?.providerId || "",
    paymentId: "",
    amount: props.initialValues?.amount || 0,
    paymentMethod: "BANK_TRANSFER" as PaymentMethod,
    paymentDate: dayjs().format("YYYY-MM-DD"),
    remark: props.initialValues?.remark || "",
    details: []
  });
  void applySettlementDefaults();
}

async function applySettlementDefaults() {
  if (props.editData) return;
  try {
    const defaults = await loadSettlementDefaults();
    if (!formData.paymentId && defaults.defaultPayableAccount) {
      formData.paymentId = defaults.defaultPayableAccount;
    }
    if (defaults.defaultPaymentMethod) {
      formData.paymentMethod = defaults.defaultPaymentMethod as PaymentMethod;
    }
  } catch (error) {
    logger.error("[SettlementDefaults] load failed", error);
  }
}

function applyEditData() {
  if (props.editData) {
    Object.assign(formData, {
      providerId: props.editData.providerId,
      paymentId: props.editData.paymentId,
      amount: (props.editData.amount || 0) / 100,
      paymentMethod: props.editData.paymentMethod || "BANK_TRANSFER",
      paymentDate: props.editData.paymentDate || dayjs().format("YYYY-MM-DD"),
      remark: props.editData.remark || "",
      details:
        props.editData.details?.map(detail => ({
          ...detail,
          payableAmount: (detail.payableAmount || 0) / 100,
          writeOffAmount: (detail.writeOffAmount || 0) / 100
        })) || []
    });
    return;
  }

  resetForm();
}

async function submit() {
  const valid = await formRef.value?.validate().catch(() => false);
  if (!valid) return false;

  if (
    selectedPaymentBalance.value !== null &&
    formData.amount > selectedPaymentBalance.value
  ) {
    message("账户余额不足", { type: "warning" });
    return false;
  }

  try {
    const submitData = {
      ...formData,
      amount: Math.round(formData.amount * 100),
      details: formData.details.map(d => ({
        ...d,
        payableAmount: Math.round((d.payableAmount || 0) * 100),
        writeOffAmount: Math.round((d.writeOffAmount || 0) * 100)
      }))
    };

    if (props.editData?.uid) {
      await updatePaymentOrderApi(props.editData.uid, submitData);
    } else {
      await createPaymentOrderApi(submitData);
    }

    message(props.editData ? "更新成功" : "创建成功", { type: "success" });
    return true;
  } catch (e) {
    handleApiError(e, "操作失败");
    return false;
  }
}

function addDetailRow() {
  formData.details.push({
    sourceOrderNo: "",
    sourceOrderType: "",
    payableAmount: 0,
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
    label: "应付金额",
    slot: "payableAmount",
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
  loadProviders();
  loadPayments();
  applyEditData();
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
        <el-form-item label="供应商" prop="providerId">
          <el-select
            v-model="formData.providerId"
            placeholder="请选择供应商"
            filterable
            class="w-full"
          >
            <el-option
              v-for="item in providerList"
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
        <el-form-item label="付款金额" prop="amount">
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
        <el-form-item label="付款方式" prop="paymentMethod">
          <el-select
            v-model="formData.paymentMethod"
            placeholder="请选择付款方式"
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
        <el-form-item label="付款日期" prop="paymentDate">
          <el-date-picker
            v-model="formData.paymentDate"
            type="date"
            placeholder="选择日期"
            value-format="YYYY-MM-DD"
            class="w-full"
          />
        </el-form-item>
      </el-col>
      <el-col :span="12">
        <el-form-item label="本次预付">
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

    <el-form-item label="备注" prop="remark">
      <el-input
        v-model="formData.remark"
        type="textarea"
        :rows="2"
        placeholder="请输入备注"
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
          <el-option label="采购入库单" value="PURCHASE_IN" />
          <el-option label="期初应付" value="INITIAL" />
        </el-select>
      </template>
      <template #payableAmount="{ row }">
        <el-input-number
          v-model="row.payableAmount"
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
          :max="row.payableAmount"
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
