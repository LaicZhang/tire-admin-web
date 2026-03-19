<script setup lang="ts">
import { reactive, ref } from "vue";
import type { FormInstance, FormRules } from "element-plus";

export type SystemSettingFormData = {
  group: string;
  key: string;
  value: string;
  isPublic: boolean;
};

const props = defineProps<{
  initial?: Partial<SystemSettingFormData>;
  recommendedEnvKeys?: string[];
}>();

const formRef = ref<FormInstance>();
const formData = reactive<SystemSettingFormData>({
  group: props.initial?.group ?? "",
  key: props.initial?.key ?? "",
  value: props.initial?.value ?? "",
  isPublic: props.initial?.isPublic ?? false
});

const rules: FormRules<SystemSettingFormData> = {
  key: [{ required: true, message: "请输入 key", trigger: "blur" }]
};

defineExpose({
  formRef,
  getData: () => ({ ...formData })
});
</script>

<template>
  <el-form ref="formRef" :model="formData" :rules="rules" label-width="90px">
    <el-form-item label="分组" prop="group">
      <el-input v-model="formData.group" placeholder="例如 env" />
    </el-form-item>
    <el-form-item
      v-if="formData.group === 'env' && recommendedEnvKeys?.length"
      label="推荐Key"
    >
      <el-select v-model="formData.key" filterable placeholder="选择推荐 key">
        <el-option
          v-for="k in recommendedEnvKeys"
          :key="k"
          :label="k"
          :value="k"
        />
      </el-select>
    </el-form-item>
    <el-form-item label="Key" prop="key">
      <el-input v-model="formData.key" placeholder="全局唯一 key" />
    </el-form-item>
    <el-form-item label="值" prop="value">
      <el-input v-model="formData.value" type="textarea" :rows="4" />
    </el-form-item>
    <el-form-item label="公开" prop="isPublic">
      <el-switch v-model="formData.isPublic" />
    </el-form-item>
  </el-form>
</template>
