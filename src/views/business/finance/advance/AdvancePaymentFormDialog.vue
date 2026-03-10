<script setup lang="ts">
import { computed, reactive, ref, watch } from "vue";
import type { FormInstance, FormRules } from "element-plus";
import dayjs from "dayjs";
import {
  createAdvancePayment,
  type AdvancePaymentType
} from "@/api/business/advance-payment";
import { handleApiError, message } from "@/utils";
import CustomerSelect from "@/components/EntitySelect/CustomerSelect.vue";
import ProviderSelect from "@/components/EntitySelect/ProviderSelect.vue";
import PaymentSelect from "@/components/EntitySelect/PaymentSelect.vue";
import { yuanToFen } from "@/utils/formatMoney";
import { PAYMENT_METHOD_OPTIONS } from "@/views/fund/payment/types";

const props = defineProps<{
  modelValue: boolean;
  initialType?: AdvancePaymentType;
}>();

const emit = defineEmits<{
  (e: "update:modelValue", value: boolean): void;
  (e: "success"): void;
}>();

const DEFAULT_TYPE: AdvancePaymentType = "RECEIPT";
const DEFAULT_PAYMENT_METHOD = "BANK_TRANSFER";

const dialogVisible = computed({
  get: () => props.modelValue,
  set: value => emit("update:modelValue", value)
});

const dialogTitle = computed(() =>
  formData.type === "PAYMENT" ? "新建预付款" : "新建预收款"
);
const helperTitle = computed(() =>
  formData.type === "PAYMENT"
    ? "预付款会生成付款单草稿，审核后才会实际扣减账户余额。"
    : "预收款创建后可在销售单中逐步核销。"
);

const loading = ref(false);
const formRef = ref<FormInstance>();
const formData = reactive({
  type: DEFAULT_TYPE as AdvancePaymentType,
  targetId: "",
  paymentId: "",
  paymentMethod: DEFAULT_PAYMENT_METHOD,
  paymentDate: dayjs().format("YYYY-MM-DD"),
  amount: 0,
  remark: ""
});

const rules: FormRules = {
  type: [{ required: true, message: "请选择类型", trigger: "change" }],
  targetId: [
    {
      validator: (_rule, value: string, callback) => {
        if (value) {
          callback();
          return;
        }
        callback(
          new Error(formData.type === "PAYMENT" ? "请选择供应商" : "请选择客户")
        );
      },
      trigger: "change"
    }
  ],
  paymentId: [
    {
      validator: (_rule, value: string, callback) => {
        if (formData.type !== "PAYMENT" || value) {
          callback();
          return;
        }
        callback(new Error("请选择结算账户"));
      },
      trigger: "change"
    }
  ],
  amount: [
    { required: true, message: "请输入金额", trigger: "blur" },
    { type: "number", min: 0.01, message: "金额必须大于 0", trigger: "blur" }
  ]
};

function resolveInitialType(): AdvancePaymentType {
  return props.initialType ?? DEFAULT_TYPE;
}

function resetForm() {
  formRef.value?.resetFields();
  Object.assign(formData, {
    type: resolveInitialType(),
    targetId: "",
    paymentId: "",
    paymentMethod: DEFAULT_PAYMENT_METHOD,
    paymentDate: dayjs().format("YYYY-MM-DD"),
    amount: 0,
    remark: ""
  });
}

watch(
  () => props.modelValue,
  visible => {
    if (visible) {
      resetForm();
    }
  }
);

watch(
  () => formData.type,
  type => {
    formData.targetId = "";
    if (type === "PAYMENT") {
      return;
    }
    formData.paymentId = "";
    formData.paymentMethod = DEFAULT_PAYMENT_METHOD;
    formData.paymentDate = dayjs().format("YYYY-MM-DD");
  }
);

async function handleSubmit() {
  const valid = await formRef.value?.validate().catch(() => false);
  if (!valid) return;

  loading.value = true;
  try {
    await createAdvancePayment({
      type: formData.type,
      targetId: formData.targetId,
      amount: yuanToFen(formData.amount),
      paymentId:
        formData.type === "PAYMENT"
          ? formData.paymentId || undefined
          : undefined,
      paymentMethod:
        formData.type === "PAYMENT"
          ? formData.paymentMethod || undefined
          : undefined,
      paymentDate:
        formData.type === "PAYMENT"
          ? formData.paymentDate || undefined
          : undefined,
      remark: formData.remark || undefined
    });
    message(
      formData.type === "PAYMENT" ? "预付款草稿创建成功" : "预收款创建成功",
      {
        type: "success"
      }
    );
    dialogVisible.value = false;
    emit("success");
  } catch (error) {
    handleApiError(
      error,
      formData.type === "PAYMENT" ? "创建预付款失败" : "创建预收款失败"
    );
  } finally {
    loading.value = false;
  }
}
</script>

<template>
  <el-dialog
    v-model="dialogVisible"
    :title="dialogTitle"
    width="620px"
    :close-on-click-modal="false"
  >
    <el-alert :title="helperTitle" type="info" :closable="false" class="mb-4" />

    <el-form ref="formRef" :model="formData" :rules="rules" label-width="100px">
      <el-form-item label="类型" prop="type">
        <el-radio-group v-model="formData.type">
          <el-radio value="RECEIPT">预收款</el-radio>
          <el-radio value="PAYMENT">预付款</el-radio>
        </el-radio-group>
      </el-form-item>

      <el-form-item
        :label="formData.type === 'PAYMENT' ? '供应商' : '客户'"
        prop="targetId"
      >
        <ProviderSelect
          v-if="formData.type === 'PAYMENT'"
          v-model="formData.targetId"
          class="w-full"
          placeholder="请选择供应商"
        />
        <CustomerSelect
          v-else
          v-model="formData.targetId"
          class="w-full"
          placeholder="请选择客户"
        />
      </el-form-item>

      <el-form-item label="金额(元)" prop="amount">
        <el-input-number
          v-model="formData.amount"
          :min="0"
          :precision="2"
          :step="100"
          class="w-full"
          controls-position="right"
        />
      </el-form-item>

      <template v-if="formData.type === 'PAYMENT'">
        <el-form-item label="结算账户" prop="paymentId">
          <PaymentSelect
            v-model="formData.paymentId"
            class="w-full"
            placeholder="请选择结算账户"
          />
        </el-form-item>

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

        <el-form-item label="付款日期" prop="paymentDate">
          <el-date-picker
            v-model="formData.paymentDate"
            type="date"
            value-format="YYYY-MM-DD"
            placeholder="请选择付款日期"
            class="w-full"
          />
        </el-form-item>
      </template>

      <el-form-item label="备注">
        <el-input
          v-model="formData.remark"
          type="textarea"
          :rows="2"
          maxlength="200"
          show-word-limit
        />
      </el-form-item>
    </el-form>

    <template #footer>
      <el-button :disabled="loading" @click="dialogVisible = false">
        取消
      </el-button>
      <el-button type="primary" :loading="loading" @click="handleSubmit">
        确定
      </el-button>
    </template>
  </el-dialog>
</template>
