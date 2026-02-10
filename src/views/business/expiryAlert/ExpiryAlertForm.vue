<script setup lang="ts">
import { computed } from "vue";

const props = defineProps<{
  formInline: {
    repoId: string;
    daysBefore: number;
  };
}>();

const emit = defineEmits<{
  "update:formInline": [value: { repoId: string; daysBefore: number }];
}>();

const formData = computed({
  get: () => props.formInline,
  set: val => emit("update:formInline", val)
});
</script>

<template>
  <el-form :model="formData" label-width="100px">
    <el-form-item label="仓库ID（可选）">
      <el-input v-model="formData.repoId" placeholder="为空表示所有仓库" />
    </el-form-item>
    <el-form-item label="提前预警天数">
      <el-input-number v-model="formData.daysBefore" :min="1" />
    </el-form-item>
  </el-form>
</template>
