<script setup lang="ts">
import { ref, reactive, computed, watch } from "vue";
import type { FormInstance, FormRules } from "element-plus";
import { ElMessage } from "element-plus";
import {
  BUSINESS_TYPE_OPTIONS,
  type WriteOffOrder,
  type CreateWriteOffDto,
  type WriteOffBusinessType
} from "./types";
import dayjs from "dayjs";
import { yuanToFen, fenToYuan } from "@/utils/money";
import { useFundForm } from "../composables/useFundForm";

const props = defineProps<{
  modelValue: boolean;
  editData?: WriteOffOrder | null;
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
  props.editData ? "编辑核销单" : "新建核销单"
);

const formRef = ref<FormInstance>();
const loading = ref(false);

// 使用 fund 模块通用 composable
const { customerList, providerList, loadCustomers, loadProviders } =
  useFundForm();

const formData = reactive<CreateWriteOffDto>({
  businessType: "ADVANCE_RECEIVABLE",
  fromCustomerId: "",
  toCustomerId: "",
  fromProviderId: "",
  toProviderId: "",
  receivableAmount: 0,
  payableAmount: 0,
  writeOffAmount: 0,
  writeOffDate: dayjs().format("YYYY-MM-DD"),
  reason: "",
  remark: ""
});

const rules: FormRules = {
  businessType: [
    { required: true, message: "请选择业务类型", trigger: "change" }
  ],
  writeOffAmount: [
    { required: true, message: "请输入核销金额", trigger: "blur" },
    {
      type: "number",
      min: 0.01,
      message: "核销金额必须大于0",
      trigger: "blur"
    }
  ]
};

// 根据业务类型判断显示哪些字段
const showCustomerFields = computed(() => {
  return [
    "ADVANCE_RECEIVABLE",
    "RECEIVABLE_PAYABLE",
    "RECEIVABLE_TRANSFER"
  ].includes(formData.businessType);
});

const showProviderFields = computed(() => {
  return ["ADVANCE_PAYABLE", "RECEIVABLE_PAYABLE", "PAYABLE_TRANSFER"].includes(
    formData.businessType
  );
});

const showTransferFields = computed(() => {
  return ["RECEIVABLE_TRANSFER", "PAYABLE_TRANSFER"].includes(
    formData.businessType
  );
});

const showReceivableAmount = computed(() => {
  return [
    "ADVANCE_RECEIVABLE",
    "RECEIVABLE_PAYABLE",
    "RECEIVABLE_TRANSFER"
  ].includes(formData.businessType);
});

const showPayableAmount = computed(() => {
  return ["ADVANCE_PAYABLE", "RECEIVABLE_PAYABLE", "PAYABLE_TRANSFER"].includes(
    formData.businessType
  );
});

function resetForm() {
  Object.assign(formData, {
    businessType: "ADVANCE_RECEIVABLE" as WriteOffBusinessType,
    fromCustomerId: "",
    toCustomerId: "",
    fromProviderId: "",
    toProviderId: "",
    receivableAmount: 0,
    payableAmount: 0,
    writeOffAmount: 0,
    writeOffDate: dayjs().format("YYYY-MM-DD"),
    reason: "",
    remark: ""
  });
  formRef.value?.resetFields();
}

watch(
  () => props.modelValue,
  val => {
    if (val) {
      loadCustomers();
      loadProviders();
      if (props.editData) {
        Object.assign(formData, {
          businessType: props.editData.businessType,
          fromCustomerId: props.editData.fromCustomerId || "",
          toCustomerId: props.editData.toCustomerId || "",
          fromProviderId: props.editData.fromProviderId || "",
          toProviderId: props.editData.toProviderId || "",
          receivableAmount: (props.editData.receivableAmount || 0) / 100,
          payableAmount: (props.editData.payableAmount || 0) / 100,
          writeOffAmount: (props.editData.writeOffAmount || 0) / 100,
          writeOffDate:
            props.editData.writeOffDate || dayjs().format("YYYY-MM-DD"),
          reason: props.editData.reason || "",
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

  // 业务校验
  if (formData.businessType === "RECEIVABLE_TRANSFER") {
    if (formData.fromCustomerId === formData.toCustomerId) {
      ElMessage.warning("转出客户和转入客户不能相同");
      return;
    }
  }
  if (formData.businessType === "PAYABLE_TRANSFER") {
    if (formData.fromProviderId === formData.toProviderId) {
      ElMessage.warning("转出供应商和转入供应商不能相同");
      return;
    }
  }

  loading.value = true;
  try {
    const submitData = {
      ...formData,
      receivableAmount: formData.receivableAmount
        ? Math.round(formData.receivableAmount * 100)
        : undefined,
      payableAmount: formData.payableAmount
        ? Math.round(formData.payableAmount * 100)
        : undefined,
      writeOffAmount: Math.round(formData.writeOffAmount * 100)
    };
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

function handleBusinessTypeChange() {
  // 清空不相关的字段
  formData.fromCustomerId = "";
  formData.toCustomerId = "";
  formData.fromProviderId = "";
  formData.toProviderId = "";
  formData.receivableAmount = 0;
  formData.payableAmount = 0;
}
</script>

<template>
  <el-dialog
    v-model="dialogVisible"
    :title="dialogTitle"
    width="700px"
    :close-on-click-modal="false"
    @close="handleClose"
  >
    <el-form
      ref="formRef"
      :model="formData"
      :rules="rules"
      label-width="120px"
      class="pr-4"
    >
      <el-form-item label="业务类型" prop="businessType">
        <el-select
          v-model="formData.businessType"
          placeholder="请选择业务类型"
          class="w-full"
          @change="handleBusinessTypeChange"
        >
          <el-option
            v-for="item in BUSINESS_TYPE_OPTIONS"
            :key="item.value"
            :label="item.label"
            :value="item.value"
          >
            <div>
              <span>{{ item.label }}</span>
              <span class="text-gray-400 text-xs ml-2">{{
                item.description
              }}</span>
            </div>
          </el-option>
        </el-select>
      </el-form-item>

      <el-row v-if="showCustomerFields" :gutter="20">
        <el-col :span="showTransferFields ? 12 : 24">
          <el-form-item
            :label="showTransferFields ? '转出客户' : '客户'"
            prop="fromCustomerId"
          >
            <el-select
              v-model="formData.fromCustomerId"
              placeholder="请选择客户"
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
        </el-col>
        <el-col
          v-if="
            showTransferFields &&
            formData.businessType === 'RECEIVABLE_TRANSFER'
          "
          :span="12"
        >
          <el-form-item label="转入客户" prop="toCustomerId">
            <el-select
              v-model="formData.toCustomerId"
              placeholder="请选择客户"
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
        </el-col>
      </el-row>

      <el-row v-if="showProviderFields" :gutter="20">
        <el-col :span="showTransferFields ? 12 : 24">
          <el-form-item
            :label="showTransferFields ? '转出供应商' : '供应商'"
            prop="fromProviderId"
          >
            <el-select
              v-model="formData.fromProviderId"
              placeholder="请选择供应商"
              filterable
              clearable
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
        <el-col
          v-if="
            showTransferFields && formData.businessType === 'PAYABLE_TRANSFER'
          "
          :span="12"
        >
          <el-form-item label="转入供应商" prop="toProviderId">
            <el-select
              v-model="formData.toProviderId"
              placeholder="请选择供应商"
              filterable
              clearable
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
      </el-row>

      <el-row :gutter="20">
        <el-col v-if="showReceivableAmount" :span="12">
          <el-form-item label="应收金额" prop="receivableAmount">
            <el-input-number
              v-model="formData.receivableAmount"
              :min="0"
              :precision="2"
              class="w-full"
              controls-position="right"
            />
          </el-form-item>
        </el-col>
        <el-col v-if="showPayableAmount" :span="12">
          <el-form-item label="应付金额" prop="payableAmount">
            <el-input-number
              v-model="formData.payableAmount"
              :min="0"
              :precision="2"
              class="w-full"
              controls-position="right"
            />
          </el-form-item>
        </el-col>
      </el-row>

      <el-row :gutter="20">
        <el-col :span="12">
          <el-form-item label="核销金额" prop="writeOffAmount">
            <el-input-number
              v-model="formData.writeOffAmount"
              :min="0"
              :precision="2"
              class="w-full"
              controls-position="right"
            />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="核销日期" prop="writeOffDate">
            <el-date-picker
              v-model="formData.writeOffDate"
              type="date"
              placeholder="选择日期"
              value-format="YYYY-MM-DD"
              class="w-full"
            />
          </el-form-item>
        </el-col>
      </el-row>

      <el-form-item label="核销原因" prop="reason">
        <el-input
          v-model="formData.reason"
          type="textarea"
          :rows="2"
          placeholder="请输入核销原因"
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
    </el-form>

    <template #footer>
      <el-button @click="handleClose">取消</el-button>
      <el-button type="primary" :loading="loading" @click="handleSubmit">
        确定
      </el-button>
    </template>
  </el-dialog>
</template>
