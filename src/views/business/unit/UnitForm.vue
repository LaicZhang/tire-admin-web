<script setup lang="ts">
import { reactive, ref, watch } from "vue";
import type { FormInstance, FormRules } from "element-plus";
import { elementRules } from "@/utils/validation/elementRules";

const props = defineProps<{
  name: string;
}>();

const emit = defineEmits<{
  "update:name": [value: string];
}>();

const formRef = ref<FormInstance>();
const form = reactive({
  name: ""
});

watch(
  () => props.name,
  val => {
    const next = String(val ?? "");
    if (next !== form.name) form.name = next;
  },
  { immediate: true }
);

watch(
  () => form.name,
  val => {
    if (val !== props.name) emit("update:name", val);
  }
);

const rules: FormRules = {
  name: [
    elementRules.requiredStringTrim("请输入单位名称"),
    elementRules.maxLen(20, "单位名称最多 20 个字符")
  ]
};

function getRef() {
  return formRef.value;
}

defineExpose({ getRef });
</script>

<template>
  <el-form ref="formRef" :model="form" :rules="rules">
    <el-form-item label="名称" prop="name" required>
      <el-input
        v-model="form.name"
        placeholder="请输入单位名称 (如: 个、箱)"
        maxlength="20"
        show-word-limit
        clearable
      />
    </el-form-item>
  </el-form>
</template>
