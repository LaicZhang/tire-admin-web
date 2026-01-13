<script setup lang="ts">
import { ref } from "vue";

const props = defineProps<{
  formData: {
    name: string;
    discount: number;
    minAmount: number;
  };
}>();

const emit = defineEmits<{
  (
    e: "submit",
    data: { name: string; discount: number; minAmount: number }
  ): void;
  (e: "close"): void;
}>();

const loading = ref(false);
const localForm = ref({ ...props.formData });
const formRef = ref();

const formRules = {
  name: [{ required: true, message: "请输入等级名称", trigger: "blur" }],
  discount: [{ required: true, message: "请输入折扣比例", trigger: "blur" }]
};

async function handleSubmit() {
  const valid = await formRef.value?.validate().catch(() => false);
  if (!valid) return;

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
    <el-form
      ref="formRef"
      :model="localForm"
      :rules="formRules"
      label-width="100px"
    >
      <el-form-item label="等级名称" prop="name">
        <el-input v-model="localForm.name" placeholder="请输入等级名称" />
      </el-form-item>
      <el-form-item label="折扣比例" prop="discount">
        <el-input-number
          v-model="localForm.discount"
          :min="1"
          :max="100"
          :precision="0"
        />
        <span class="ml-2">%</span>
      </el-form-item>
      <el-form-item label="最低消费金额" prop="minAmount">
        <el-input-number
          v-model="localForm.minAmount"
          :min="0"
          :precision="2"
        />
        <span class="ml-2">元</span>
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
