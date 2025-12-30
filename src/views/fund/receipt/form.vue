<script setup lang="ts">
import { computed, reactive, ref, watch } from "vue";
import type { FormInstance, FormRules } from "element-plus";
import { getCustomerListApi } from "@/api/business/customer";
import { createAdvancePayment } from "@/api/business/advance-payment";
import { handleApiError, message } from "@/utils";

const props = defineProps<{
  modelValue: boolean;
}>();

const emit = defineEmits<{
  (e: "update:modelValue", value: boolean): void;
  (e: "success"): void;
}>();

const dialogVisible = computed({
  get: () => props.modelValue,
  set: val => emit("update:modelValue", val)
});

const formRef = ref<FormInstance>();
const loading = ref(false);
const customerList = ref<Array<{ uid: string; name: string }>>([]);

const formData = reactive({
  customerId: "",
  /** 元 */
  amount: 0,
  remark: ""
});

const rules: FormRules = {
  customerId: [{ required: true, message: "请选择客户", trigger: "change" }],
  amount: [
    { required: true, message: "请输入金额", trigger: "blur" },
    { type: "number", min: 0.01, message: "金额必须大于0", trigger: "blur" }
  ]
};

async function loadCustomers() {
  try {
    const res = await getCustomerListApi(1, { keyword: "" });
    if (res.code === 200) {
      customerList.value = res.data?.list || [];
    } else {
      message(res.msg || "加载客户列表失败", { type: "error" });
    }
  } catch (error) {
    handleApiError(error, "加载客户列表失败");
  }
}

function resetForm() {
  formData.customerId = "";
  formData.amount = 0;
  formData.remark = "";
  formRef.value?.resetFields();
}

watch(
  () => props.modelValue,
  val => {
    if (!val) return;
    resetForm();
    loadCustomers();
  }
);

async function handleSubmit() {
  const valid = await formRef.value?.validate().catch(() => false);
  if (!valid) return;

  loading.value = true;
  try {
    await createAdvancePayment({
      type: "RECEIPT",
      targetId: formData.customerId,
      amount: Math.round(formData.amount * 100),
      remark: formData.remark
    });
    message("新建成功", { type: "success" });
    dialogVisible.value = false;
    emit("success");
  } catch (error) {
    handleApiError(error, "新建失败");
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
    title="新建预收款"
    width="560px"
    :close-on-click-modal="false"
    @close="handleClose"
  >
    <el-form ref="formRef" :model="formData" :rules="rules" label-width="90px">
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
