<script setup lang="ts">
import { computed, onMounted, reactive, ref } from "vue";
import type { FormInstance, FormRules } from "element-plus";
import { createTransferApi } from "@/api/fund/transfer";
import { handleApiError } from "@/utils/error";
import { message } from "@/utils";
import type { CreateTransferDto, Transfer } from "./types";
import dayjs from "dayjs";
import { fenToYuan } from "@/utils/formatMoney";
import { useFundForm } from "../composables/useFundForm";

const props = defineProps<{
  editData?: Transfer | null;
}>();

const formRef = ref<FormInstance>();

const { paymentList, loadPayments } = useFundForm();

const formData = reactive<CreateTransferDto>({
  fromPaymentId: "",
  toPaymentId: "",
  amount: 0,
  fee: 0,
  feePaymentId: "",
  transferDate: dayjs().format("YYYY-MM-DD"),
  remark: ""
});

const rules: FormRules = {
  fromPaymentId: [
    { required: true, message: "请选择转出账户", trigger: "change" }
  ],
  toPaymentId: [
    { required: true, message: "请选择转入账户", trigger: "change" }
  ],
  amount: [
    { required: true, message: "请输入转账金额", trigger: "blur" },
    {
      type: "number",
      min: 0.01,
      message: "转账金额必须大于0",
      trigger: "blur"
    }
  ]
};

const fromAccountOptions = computed(() => {
  return paymentList.value.filter(acc => acc.uid !== formData.toPaymentId);
});

const toAccountOptions = computed(() => {
  return paymentList.value.filter(acc => acc.uid !== formData.fromPaymentId);
});

const selectedFromAccount = computed(() => {
  return paymentList.value.find(acc => acc.uid === formData.fromPaymentId);
});

const showFeePayment = computed(() => {
  return formData.fee && formData.fee > 0;
});

function resetForm() {
  Object.assign(formData, {
    fromPaymentId: "",
    toPaymentId: "",
    amount: 0,
    fee: 0,
    feePaymentId: "",
    transferDate: dayjs().format("YYYY-MM-DD"),
    remark: ""
  });
  formRef.value?.resetFields?.();
}

function applyEditData() {
  if (props.editData) {
    Object.assign(formData, {
      fromPaymentId: props.editData.fromPaymentId,
      toPaymentId: props.editData.toPaymentId,
      amount: (props.editData.amount || 0) / 100,
      fee: (props.editData.fee || 0) / 100,
      feePaymentId: props.editData.feePaymentId || "",
      transferDate: props.editData.transferDate || dayjs().format("YYYY-MM-DD"),
      remark: props.editData.remark || ""
    });
    return;
  }

  resetForm();
}

async function submit() {
  const valid = await formRef.value?.validate().catch(() => false);
  if (!valid) return false;

  if (props.editData) {
    message("当前仅支持新建，编辑能力待后端补齐更新接口", {
      type: "warning"
    });
    return false;
  }

  if (formData.fromPaymentId === formData.toPaymentId) {
    message("转出账户和转入账户不能相同", { type: "warning" });
    return false;
  }

  const totalAmount = formData.amount + (formData.fee || 0);
  if (
    selectedFromAccount.value?.balance !== undefined &&
    totalAmount > selectedFromAccount.value.balance / 100
  ) {
    message("转出账户余额不足", { type: "warning" });
    return false;
  }

  try {
    const submitData = {
      ...formData,
      amount: Math.round(formData.amount * 100),
      fee: formData.fee ? Math.round(formData.fee * 100) : undefined
    };

    await createTransferApi(submitData);
    message("创建成功", { type: "success" });
    return true;
  } catch (e) {
    handleApiError(e);
    return false;
  }
}

defineExpose({ submit });

onMounted(() => {
  loadPayments();
  applyEditData();
});
</script>

<template>
  <el-form
    ref="formRef"
    :model="formData"
    :rules="rules"
    label-width="120px"
    class="pr-4"
  >
    <el-form-item label="转出账户" prop="fromPaymentId">
      <el-select
        v-model="formData.fromPaymentId"
        placeholder="请选择转出账户"
        filterable
        class="w-full"
      >
        <el-option
          v-for="item in fromAccountOptions"
          :key="item.uid"
          :label="`${item.name}${item.balance !== undefined ? ` (余额: ¥${fenToYuan(item.balance)})` : ''}`"
          :value="item.uid"
        />
      </el-select>
    </el-form-item>

    <el-form-item label="转入账户" prop="toPaymentId">
      <el-select
        v-model="formData.toPaymentId"
        placeholder="请选择转入账户"
        filterable
        class="w-full"
      >
        <el-option
          v-for="item in toAccountOptions"
          :key="item.uid"
          :label="item.name"
          :value="item.uid"
        />
      </el-select>
    </el-form-item>

    <el-row :gutter="20">
      <el-col :span="12">
        <el-form-item label="转账金额" prop="amount">
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
        <el-form-item label="转账日期" prop="transferDate">
          <el-date-picker
            v-model="formData.transferDate"
            type="date"
            placeholder="选择日期"
            value-format="YYYY-MM-DD"
            class="w-full"
          />
        </el-form-item>
      </el-col>
    </el-row>

    <el-divider content-position="left">手续费设置（可选）</el-divider>

    <el-row :gutter="20">
      <el-col :span="12">
        <el-form-item label="手续费" prop="fee">
          <el-input-number
            v-model="formData.fee"
            :min="0"
            :precision="2"
            class="w-full"
            controls-position="right"
            placeholder="如有手续费请填写"
          />
        </el-form-item>
      </el-col>
      <el-col v-if="showFeePayment" :span="12">
        <el-form-item label="手续费承担方" prop="feePaymentId">
          <el-select
            v-model="formData.feePaymentId"
            placeholder="默认转出账户承担"
            clearable
            class="w-full"
          >
            <el-option
              v-for="item in paymentList"
              :key="item.uid"
              :label="item.name"
              :value="item.uid"
            />
          </el-select>
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
  </el-form>
</template>
