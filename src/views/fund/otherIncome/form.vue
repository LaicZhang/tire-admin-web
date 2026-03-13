<script setup lang="ts">
import { computed, reactive, ref, watch } from "vue";
import type { FormInstance, FormRules } from "element-plus";
import { createOtherIncomeApi } from "@/api/fund/other-income";
import { handleApiError, message } from "@/utils";
import { useSysDictOptions } from "@/composables/useSysDict";
import CustomerSelect from "@/components/EntitySelect/CustomerSelect.vue";
import PaymentSelect from "@/components/EntitySelect/PaymentSelect.vue";
import {
  INCOME_TYPE_OPTIONS,
  type OtherIncome,
  type CreateOtherIncomeDto,
  type IncomeType
} from "./types";
import dayjs from "dayjs";

const props = defineProps<{
  editData?: OtherIncome | null;
}>();

const formRef = ref<FormInstance>();
const { options: fundCategoryOptions } = useSysDictOptions("fundCategory");

const formData = reactive<CreateOtherIncomeDto>({
  customerId: "",
  incomeType: "OTHER",
  amount: 0,
  receivedAmount: 0,
  paymentId: "",
  incomeDate: dayjs().format("YYYY-MM-DD"),
  category: "",
  remark: ""
});

const rules: FormRules = {
  incomeType: [
    { required: true, message: "请选择收入类型", trigger: "change" }
  ],
  amount: [
    { required: true, message: "请输入金额", trigger: "blur" },
    { type: "number", min: 0.01, message: "金额必须大于0", trigger: "blur" }
  ]
};

const needReceive = computed(() => {
  return formData.receivedAmount && formData.receivedAmount > 0;
});

function resetForm() {
  Object.assign(formData, {
    customerId: "",
    incomeType: "OTHER" as IncomeType,
    amount: 0,
    receivedAmount: 0,
    paymentId: "",
    incomeDate: dayjs().format("YYYY-MM-DD"),
    category: "",
    remark: ""
  });
  formRef.value?.resetFields?.();
}

watch(
  () => props.editData,
  editData => {
    if (editData) {
      Object.assign(formData, {
        customerId: editData.customerId || "",
        incomeType: editData.incomeType,
        amount: (editData.amount || 0) / 100,
        receivedAmount: (editData.receivedAmount || 0) / 100,
        paymentId: editData.paymentId || "",
        incomeDate: editData.incomeDate || dayjs().format("YYYY-MM-DD"),
        category: editData.category || "",
        remark: editData.remark || ""
      });
      return;
    }

    resetForm();
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

  if (
    formData.receivedAmount &&
    formData.receivedAmount > 0 &&
    !formData.paymentId
  ) {
    message("请选择收款账户", { type: "warning" });
    return false;
  }

  if (formData.receivedAmount && formData.receivedAmount > formData.amount) {
    message("本次收款金额不能大于总金额", { type: "warning" });
    return false;
  }

  try {
    const submitData = {
      ...formData,
      amount: Math.round(formData.amount * 100),
      receivedAmount: formData.receivedAmount
        ? Math.round(formData.receivedAmount * 100)
        : undefined
    };

    await createOtherIncomeApi(submitData);
    message("创建成功", { type: "success" });
    return true;
  } catch (e) {
    handleApiError(e, "操作失败");
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
    <el-form-item label="客户" prop="customerId">
      <CustomerSelect
        v-model="formData.customerId"
        placeholder="请选择客户（可选）"
        class="w-full"
      />
    </el-form-item>

    <el-form-item label="收入类型" prop="incomeType">
      <el-select
        v-model="formData.incomeType"
        placeholder="请选择收入类型"
        class="w-full"
      >
        <el-option
          v-for="item in INCOME_TYPE_OPTIONS"
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
        <el-form-item label="收入日期" prop="incomeDate">
          <el-date-picker
            v-model="formData.incomeDate"
            type="date"
            placeholder="选择日期"
            value-format="YYYY-MM-DD"
            class="w-full"
          />
        </el-form-item>
      </el-col>
    </el-row>

    <el-divider content-position="left">收款信息（可选）</el-divider>

    <el-row :gutter="20">
      <el-col :span="12">
        <el-form-item label="本次收款" prop="receivedAmount">
          <el-input-number
            v-model="formData.receivedAmount"
            :min="0"
            :max="formData.amount"
            :precision="2"
            class="w-full"
            controls-position="right"
            placeholder="如已收款请填写"
          />
        </el-form-item>
      </el-col>
      <el-col :span="12">
        <el-form-item label="收款账户" prop="paymentId">
          <PaymentSelect
            v-model="formData.paymentId"
            placeholder="请选择收款账户"
            class="w-full"
            :disabled="!needReceive"
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
      提示：若本次收款金额为0，可后续通过收款单登记后再核销
    </div>
  </el-form>
</template>
