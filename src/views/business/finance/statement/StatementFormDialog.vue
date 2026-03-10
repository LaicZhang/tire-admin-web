<script setup lang="ts">
import { computed, reactive, ref, watch } from "vue";
import type { FormInstance, FormRules } from "element-plus";
import dayjs from "dayjs";
import { createStatement } from "@/api/business/statement";
import { handleApiError, message } from "@/utils";
import CustomerSelect from "@/components/EntitySelect/CustomerSelect.vue";
import ProviderSelect from "@/components/EntitySelect/ProviderSelect.vue";
import { yuanToFen } from "@/utils/formatMoney";

type StatementType = "CUSTOMER" | "PROVIDER";

const props = defineProps<{
  modelValue: boolean;
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
const formRef = ref<FormInstance>();
const formData = reactive({
  type: "CUSTOMER" as StatementType,
  targetId: "",
  dateRange: [
    dayjs().startOf("month").format("YYYY-MM-DD"),
    dayjs().format("YYYY-MM-DD")
  ] as [string, string],
  openingBalance: 0
});

const rules: FormRules = {
  type: [{ required: true, message: "请选择对账类型", trigger: "change" }],
  targetId: [{ required: true, message: "请选择往来单位", trigger: "change" }],
  dateRange: [{ required: true, message: "请选择对账周期", trigger: "change" }]
};

function resetForm() {
  formRef.value?.resetFields();
  formData.type = "CUSTOMER";
  formData.targetId = "";
  formData.dateRange = [
    dayjs().startOf("month").format("YYYY-MM-DD"),
    dayjs().format("YYYY-MM-DD")
  ];
  formData.openingBalance = 0;
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
  () => {
    formData.targetId = "";
  }
);

async function handleSubmit() {
  const valid = await formRef.value?.validate().catch(() => false);
  if (!valid) return;

  const [startDate, endDate] = formData.dateRange;
  if (!startDate || !endDate) {
    message("请选择完整对账周期", { type: "warning" });
    return;
  }

  loading.value = true;
  try {
    await createStatement({
      type: formData.type,
      targetId: formData.targetId,
      startDate,
      endDate,
      openingBalance: yuanToFen(formData.openingBalance)
    });
    message("对账单创建成功", { type: "success" });
    dialogVisible.value = false;
    emit("success");
  } catch (error) {
    handleApiError(error, "创建对账单失败");
  } finally {
    loading.value = false;
  }
}
</script>

<template>
  <el-dialog
    v-model="dialogVisible"
    title="新建对账单"
    width="620px"
    :close-on-click-modal="false"
  >
    <el-form ref="formRef" :model="formData" :rules="rules" label-width="100px">
      <el-form-item label="对账类型" prop="type">
        <el-radio-group v-model="formData.type">
          <el-radio value="CUSTOMER">客户对账</el-radio>
          <el-radio value="PROVIDER">供应商对账</el-radio>
        </el-radio-group>
      </el-form-item>

      <el-form-item label="往来单位" prop="targetId">
        <CustomerSelect
          v-if="formData.type === 'CUSTOMER'"
          v-model="formData.targetId"
          class="w-full"
          placeholder="请选择客户"
        />
        <ProviderSelect
          v-else
          v-model="formData.targetId"
          class="w-full"
          placeholder="请选择供应商"
        />
      </el-form-item>

      <el-form-item label="对账周期" prop="dateRange">
        <el-date-picker
          v-model="formData.dateRange"
          type="daterange"
          start-placeholder="开始日期"
          end-placeholder="结束日期"
          value-format="YYYY-MM-DD"
          class="w-full"
        />
      </el-form-item>

      <el-form-item label="期初余额">
        <el-input-number
          v-model="formData.openingBalance"
          :precision="2"
          :step="100"
          class="w-full"
          controls-position="right"
        />
      </el-form-item>
    </el-form>

    <template #footer>
      <el-button :disabled="loading" @click="dialogVisible = false">
        取消
      </el-button>
      <el-button type="primary" :loading="loading" @click="handleSubmit">
        生成
      </el-button>
    </template>
  </el-dialog>
</template>
