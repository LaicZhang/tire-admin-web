<script setup lang="ts">
import { ref } from "vue";
import type { FormInstance, FormRules } from "element-plus";
import { elementRules } from "@/utils/validation/elementRules";

const props = defineProps<{
  formData: {
    name: string;
    color: string;
  };
}>();

const emit = defineEmits<{
  (e: "submit", data: { name: string; color: string }): void;
  (e: "close"): void;
}>();

const loading = ref(false);
const localForm = ref({ ...props.formData });
const formRef = ref<FormInstance>();

const rules: FormRules = {
  name: [
    elementRules.requiredStringTrim("请输入标签名称"),
    elementRules.maxLen(50, "标签名称最多 50 个字符")
  ],
  color: [elementRules.requiredSelect("请选择标签颜色", "change")]
};

const colors = [
  "#409EFF",
  "#67C23A",
  "#E6A23C",
  "#F56C6C",
  "#909399",
  "#00d4ff",
  "#ff85c0",
  "#b37feb"
];

async function handleSubmit() {
  const valid = await formRef.value?.validate().catch(() => false);
  if (!valid) return;

  loading.value = true;
  try {
    emit("submit", {
      name: localForm.value.name.trim(),
      color: localForm.value.color
    });
  } finally {
    loading.value = false;
  }
}
</script>

<template>
  <div>
    <el-form ref="formRef" :model="localForm" :rules="rules" label-width="80px">
      <el-form-item label="标签名称" prop="name">
        <el-input
          v-model="localForm.name"
          placeholder="请输入标签名称"
          maxlength="50"
          show-word-limit
          clearable
        />
      </el-form-item>
      <el-form-item label="标签颜色" prop="color">
        <div class="flex flex-wrap gap-2">
          <div
            v-for="color in colors"
            :key="color"
            class="w-8 h-8 rounded cursor-pointer border-2"
            :style="{
              backgroundColor: color,
              borderColor: localForm.color === color ? '#000' : 'transparent'
            }"
            @click="localForm.color = color"
          />
        </div>
      </el-form-item>
    </el-form>
    <div class="flex justify-end gap-2 mt-4">
      <el-button @click="emit('close')">取消</el-button>
      <el-button type="primary" :loading="loading" @click="handleSubmit">
        确定
      </el-button>
    </div>
  </div>
</template>
