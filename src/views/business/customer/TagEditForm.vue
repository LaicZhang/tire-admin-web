<script setup lang="ts">
import { ref } from "vue";
import { message } from "@/utils";

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
  if (!localForm.value.name.trim()) {
    message("请输入标签名称", { type: "warning" });
    return;
  }

  loading.value = true;
  try {
    emit("submit", localForm.value);
  } finally {
    loading.value = false;
  }
}
</script>

<template>
  <div>
    <el-form :model="localForm" label-width="80px">
      <el-form-item label="标签名称" required>
        <el-input v-model="localForm.name" placeholder="请输入标签名称" />
      </el-form-item>
      <el-form-item label="标签颜色">
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
