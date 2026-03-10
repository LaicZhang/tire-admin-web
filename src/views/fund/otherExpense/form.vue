<script setup lang="ts">
import { computed, reactive, ref, watch } from "vue";
import type { FormInstance, FormRules } from "element-plus";
import { createOtherExpenseApi } from "@/api/fund/other-expense";
import { getPaymentApi } from "@/api";
import { handleApiError } from "@/utils/error";
import { message } from "@/utils";
import {
  EXPENSE_TYPE_OPTIONS,
  type OtherExpense,
  type CreateOtherExpenseDto,
  type ExpenseType
} from "./types";
import dayjs from "dayjs";
import { useSysDictOptions } from "@/composables/useSysDict";
import ProviderSelect from "@/components/EntitySelect/ProviderSelect.vue";
import PaymentSelect from "@/components/EntitySelect/PaymentSelect.vue";

const props = defineProps<{
  editData?: OtherExpense | null;
}>();

const formRef = ref<FormInstance>();
const { options: fundCategoryOptions } = useSysDictOptions("fundCategory");

const formData = reactive<CreateOtherExpenseDto>({
  providerId: "",
  expenseType: "OTHER",
  amount: 0,
  paidAmount: 0,
  paymentId: "",
  expenseDate: dayjs().format("YYYY-MM-DD"),
  category: "",
  relatedOrderId: "",
  remark: ""
});

const rules: FormRules = {
  expenseType: [
    { required: true, message: "请选择支出类型", trigger: "change" }
  ],
  amount: [
    { required: true, message: "请输入金额", trigger: "blur" },
    { type: "number", min: 0.01, message: "金额必须大于0", trigger: "blur" }
  ]
};

const needPay = computed(() => {
  return formData.paidAmount && formData.paidAmount > 0;
});

const selectedPaymentBalance = ref<number | null>(null);

function resetForm() {
  Object.assign(formData, {
    providerId: "",
    expenseType: "OTHER" as ExpenseType,
    amount: 0,
    paidAmount: 0,
    paymentId: "",
    expenseDate: dayjs().format("YYYY-MM-DD"),
    category: "",
    relatedOrderId: "",
    remark: ""
  });
  formRef.value?.resetFields?.();
}

watch(
  () => props.editData,
  editData => {
    if (editData) {
      Object.assign(formData, {
        providerId: editData.providerId || "",
        expenseType: editData.expenseType,
        amount: (editData.amount || 0) / 100,
        paidAmount: (editData.paidAmount || 0) / 100,
        paymentId: editData.paymentId || "",
        expenseDate: editData.expenseDate || dayjs().format("YYYY-MM-DD"),
        category: editData.category || "",
        relatedOrderId: editData.relatedOrderId || "",
        remark: editData.remark || ""
      });
      return;
    }

    resetForm();
  },
  { immediate: true }
);

watch(
  () => formData.paymentId,
  async paymentId => {
    if (!paymentId) {
      selectedPaymentBalance.value = null;
      return;
    }

    try {
      const res = await getPaymentApi(paymentId);
      if (res.code !== 200) {
        selectedPaymentBalance.value = null;
        return;
      }

      const balance = Number(res.data?.balance ?? NaN);
      selectedPaymentBalance.value = Number.isFinite(balance)
        ? balance / 100
        : null;
    } catch {
      selectedPaymentBalance.value = null;
    }
  },
  { immediate: true }
);

async function submit() {
  const valid = await formRef.value?.validate().catch(() => false);
  if (!valid) return false;

  if (props.editData) {
    message("当前仅支持新建，编辑能力待后端补齐更新接口", {
      type: "warning"
    });
    return false;
  }

  if (formData.paidAmount && formData.paidAmount > 0 && !formData.paymentId) {
    message("请选择付款账户", { type: "warning" });
    return false;
  }

  if (formData.paidAmount && formData.paidAmount > formData.amount) {
    message("本次付款金额不能大于总金额", { type: "warning" });
    return false;
  }

  if (
    formData.paidAmount &&
    selectedPaymentBalance.value !== null &&
    formData.paidAmount > selectedPaymentBalance.value
  ) {
    message("账户余额不足", { type: "warning" });
    return false;
  }

  try {
    const submitData = {
      ...formData,
      amount: Math.round(formData.amount * 100),
      paidAmount: formData.paidAmount
        ? Math.round(formData.paidAmount * 100)
        : undefined
    };

    await createOtherExpenseApi(submitData);
    message("创建成功", { type: "success" });
    return true;
  } catch (e) {
    handleApiError(e);
    return false;
  }
}

defineExpose({ submit });
</script>

<template>
  <el-form
    ref="formRef"
    :model="formData"
    :rules="rules"
    label-width="100px"
    class="pr-4"
  >
    <el-form-item label="供应商" prop="providerId">
      <ProviderSelect
        v-model="formData.providerId"
        placeholder="请选择供应商（可选）"
        class="w-full"
      />
    </el-form-item>

    <el-form-item label="支出类型" prop="expenseType">
      <el-select
        v-model="formData.expenseType"
        placeholder="请选择支出类型"
        class="w-full"
      >
        <el-option
          v-for="item in EXPENSE_TYPE_OPTIONS"
          :key="item.value"
          :label="item.label"
          :value="item.value"
        />
      </el-select>
    </el-form-item>

    <el-row :gutter="20">
      <el-col :span="12">
        <el-form-item label="金额" prop="amount">
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
        <el-form-item label="支出日期" prop="expenseDate">
          <el-date-picker
            v-model="formData.expenseDate"
            type="date"
            placeholder="选择日期"
            value-format="YYYY-MM-DD"
            class="w-full"
          />
        </el-form-item>
      </el-col>
    </el-row>

    <el-divider content-position="left">付款信息（可选）</el-divider>

    <el-row :gutter="20">
      <el-col :span="12">
        <el-form-item label="本次付款" prop="paidAmount">
          <el-input-number
            v-model="formData.paidAmount"
            :min="0"
            :max="formData.amount"
            :precision="2"
            class="w-full"
            controls-position="right"
            placeholder="如已付款请填写"
          />
        </el-form-item>
      </el-col>
      <el-col :span="12">
        <el-form-item label="付款账户" prop="paymentId">
          <PaymentSelect
            v-model="formData.paymentId"
            placeholder="请选择付款账户"
            class="w-full"
            :disabled="!needPay"
          />
        </el-form-item>
      </el-col>
    </el-row>

    <el-form-item label="分类" prop="category">
      <el-select
        v-model="formData.category"
        placeholder="请选择或输入分类"
        filterable
        clearable
        allow-create
        default-first-option
        class="w-full"
      >
        <el-option
          v-for="item in fundCategoryOptions"
          :key="item.value"
          :label="item.label"
          :value="item.value"
        />
      </el-select>
    </el-form-item>

    <el-form-item label="备注" prop="remark">
      <el-input
        v-model="formData.remark"
        type="textarea"
        :rows="2"
        placeholder="请输入备注"
      />
    </el-form-item>

    <div class="text-gray-400 text-sm">
      提示：若本次付款金额为0，可后续通过付款单或核销单进行核销
    </div>
  </el-form>
</template>
