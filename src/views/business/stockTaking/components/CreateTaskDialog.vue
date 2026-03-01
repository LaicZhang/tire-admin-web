<script setup lang="ts">
import { ref } from "vue";
import type { FormInstance, FormRules } from "element-plus";
import { elementRules } from "@/utils/validation/elementRules";

defineProps<{
  visible: boolean;
  loading: boolean;
  form: {
    name: string;
    remark: string;
  };
}>();

const emit = defineEmits<{
  "update:visible": [value: boolean];
  "update:form": [value: { name: string; remark: string }];
  submit: [];
}>();

const formRef = ref<FormInstance>();

const rules: FormRules = {
  name: [elementRules.maxLen(50, "任务名称最多 50 个字符")],
  remark: [elementRules.maxLen(200, "备注最多 200 个字符")]
};

async function handleSubmit() {
  const valid = await formRef.value?.validate().catch(() => false);
  if (!valid) return;
  emit("submit");
}
</script>

<template>
  <el-dialog
    :model-value="visible"
    title="创建盘点任务"
    width="500px"
    @update:model-value="emit('update:visible', $event)"
  >
    <el-form ref="formRef" :model="form" :rules="rules" label-width="100px">
      <el-form-item label="任务名称" prop="name">
        <el-input
          :model-value="form.name"
          placeholder="留空则自动生成"
          maxlength="50"
          show-word-limit
          clearable
          @update:model-value="emit('update:form', { ...form, name: $event })"
        />
      </el-form-item>
      <el-form-item label="备注" prop="remark">
        <el-input
          :model-value="form.remark"
          type="textarea"
          placeholder="可选"
          maxlength="200"
          show-word-limit
          @update:model-value="emit('update:form', { ...form, remark: $event })"
        />
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button @click="emit('update:visible', false)">取消</el-button>
      <el-button type="primary" :loading="loading" @click="handleSubmit">
        创建
      </el-button>
    </template>
  </el-dialog>
</template>
