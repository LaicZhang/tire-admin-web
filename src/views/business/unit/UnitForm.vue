<script setup lang="ts">
defineProps<{
  name: string;
}>();

defineEmits<{
  "update:name": [value: string];
}>();
</script>

<template>
  <el-form>
    <el-form-item label="名称" required>
      <el-input
        :model-value="name"
        placeholder="请输入单位名称 (如: 个、箱)"
        @update:model-value="$emit('update:name', $event)"
      />
    </el-form-item>
  </el-form>
</template>
