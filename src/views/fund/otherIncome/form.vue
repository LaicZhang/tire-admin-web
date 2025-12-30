<script setup lang="ts">
import { ref, reactive, computed, watch } from "vue";
import type { FormInstance, FormRules } from "element-plus";
import { ElMessage } from "element-plus";
import { getCustomerListApi } from "@/api/business/customer";
import { getPaymentListApi } from "@/api/payment";
import {
  INCOME_TYPE_OPTIONS,
  type OtherIncome,
  type CreateOtherIncomeDto,
  type IncomeType
} from "./types";
import dayjs from "dayjs";

const props = defineProps<{
  modelValue: boolean;
  editData?: OtherIncome | null;
}>();

const emit = defineEmits<{
  (e: "update:modelValue", value: boolean): void;
  (e: "success"): void;
}>();

const dialogVisible = computed({
  get: () => props.modelValue,
  set: val => emit("update:modelValue", val)
});

const dialogTitle = computed(() =>
  props.editData ? "编辑其他收入单" : "新建其他收入单"
);

const formRef = ref<FormInstance>();
const loading = ref(false);
const customerList = ref<Array<{ uid: string; name: string }>>([]);
const paymentList = ref<Array<{ uid: string; name: string; balance?: number }>>(
  []
);

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

// 是否需要收款
const needReceive = computed(() => {
  return formData.receivedAmount && formData.receivedAmount > 0;
});

async function loadCustomers() {
  try {
    const res = await getCustomerListApi(1, { keyword: "" });
    customerList.value = res.data?.list || [];
  } catch (e) {
    console.error("加载客户列表失败", e);
  }
}

async function loadPayments() {
  try {
    const res = await getPaymentListApi();
    paymentList.value =
      (res.data as Array<{ uid: string; name: string; balance?: number }>) ||
      [];
  } catch (e) {
    console.error("加载账户列表失败", e);
  }
}

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
  formRef.value?.resetFields();
}

watch(
  () => props.modelValue,
  val => {
    if (val) {
      loadCustomers();
      loadPayments();
      if (props.editData) {
        Object.assign(formData, {
          customerId: props.editData.customerId || "",
          incomeType: props.editData.incomeType,
          amount: (props.editData.amount || 0) / 100,
          receivedAmount: (props.editData.receivedAmount || 0) / 100,
          paymentId: props.editData.paymentId || "",
          incomeDate: props.editData.incomeDate || dayjs().format("YYYY-MM-DD"),
          category: props.editData.category || "",
          remark: props.editData.remark || ""
        });
      } else {
        resetForm();
      }
    }
  }
);

async function handleSubmit() {
  const valid = await formRef.value?.validate().catch(() => false);
  if (!valid) return;

  // 业务校验：如果有收款金额，必须选择收款账户
  if (
    formData.receivedAmount &&
    formData.receivedAmount > 0 &&
    !formData.paymentId
  ) {
    ElMessage.warning("请选择收款账户");
    return;
  }

  // 收款金额不能大于总金额
  if (formData.receivedAmount && formData.receivedAmount > formData.amount) {
    ElMessage.warning("本次收款金额不能大于总金额");
    return;
  }

  loading.value = true;
  try {
    const submitData = {
      ...formData,
      amount: Math.round(formData.amount * 100),
      receivedAmount: formData.receivedAmount
        ? Math.round(formData.receivedAmount * 100)
        : undefined
    };
    console.log("提交数据:", submitData);

    ElMessage.success(props.editData ? "更新成功" : "创建成功");
    dialogVisible.value = false;
    emit("success");
  } catch (e) {
    const error = e as Error;
    ElMessage.error(error.message || "操作失败");
  } finally {
    loading.value = false;
  }
}

function handleClose() {
  dialogVisible.value = false;
  resetForm();
}
</script>

<template>
  <el-dialog
    v-model="dialogVisible"
    :title="dialogTitle"
    width="600px"
    :close-on-click-modal="false"
    @close="handleClose"
  >
    <el-form
      ref="formRef"
      :model="formData"
      :rules="rules"
      label-width="100px"
      class="pr-4"
    >
      <el-form-item label="客户" prop="customerId">
        <el-select
          v-model="formData.customerId"
          placeholder="请选择客户（可选）"
          filterable
          clearable
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
            <el-select
              v-model="formData.paymentId"
              placeholder="请选择收款账户"
              filterable
              clearable
              class="w-full"
              :disabled="!needReceive"
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

      <el-form-item label="分类" prop="category">
        <el-input
          v-model="formData.category"
          placeholder="可选分类标签"
          clearable
        />
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
        提示：若本次收款金额为0，可后续通过收款单或核销单进行核销
      </div>
    </el-form>

    <template #footer>
      <el-button @click="handleClose">取消</el-button>
      <el-button type="primary" :loading="loading" @click="handleSubmit">
        确定
      </el-button>
    </template>
  </el-dialog>
</template>
