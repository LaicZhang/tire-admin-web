<script setup lang="ts">
import { ref, reactive } from "vue";
import type { PriceListType } from "@/api/business/price-list";

interface FormProps {
  formInline: {
    id?: number;
    name: string;
    type: PriceListType;
    isDefault: boolean;
    isActive: boolean;
  };
}

const props = defineProps<FormProps>();

const ruleFormRef = ref();
const newFormInline = ref(props.formInline);

const formRules = reactive({
  name: [{ required: true, message: "名称为必填项", trigger: "blur" }],
  type: [{ required: true, message: "类型为必填项", trigger: "change" }]
});

defineExpose({ formRef: ruleFormRef });
</script>

<template>
  <el-form
    ref="ruleFormRef"
    :model="newFormInline"
    :rules="formRules"
    label-width="82px"
  >
    <el-form-item label="名称" prop="name">
      <el-input
        v-model="newFormInline.name"
        clearable
        placeholder="请输入价目表名称"
      />
    </el-form-item>

    <el-form-item label="类型" prop="type">
      <el-select v-model="newFormInline.type" placeholder="请选择类型">
        <el-option label="标准价" value="STANDARD" />
        <el-option label="促销价" value="PROMOTION" />
        <el-option label="特价" value="SPECIAL" />
      </el-select>
    </el-form-item>

    <el-form-item label="默认价目表">
      <el-switch v-model="newFormInline.isDefault" />
    </el-form-item>

    <el-form-item label="启用">
      <el-switch v-model="newFormInline.isActive" />
    </el-form-item>
  </el-form>
</template>
