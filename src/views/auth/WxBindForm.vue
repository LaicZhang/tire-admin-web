<script setup lang="ts">
import { Loading } from "@element-plus/icons-vue";

defineProps<{
  qrUrl: string;
}>();

const emit = defineEmits<{
  (e: "check"): void;
  (e: "close"): void;
}>();
</script>

<template>
  <div>
    <div class="text-center">
      <p class="mb-4">请使用微信扫描二维码完成绑定</p>
      <div v-if="qrUrl" class="flex justify-center">
        <img :src="qrUrl" alt="微信二维码" class="w-48 h-48 border rounded" />
      </div>
      <div
        v-else
        class="w-48 h-48 mx-auto flex items-center justify-center bg-gray-100 rounded"
      >
        <el-icon class="text-4xl text-gray-300 is-loading"><Loading /></el-icon>
      </div>
      <p class="text-xs text-gray-400 mt-4">二维码有效期 5 分钟</p>
    </div>
    <div class="flex justify-end gap-2 mt-4">
      <el-button @click="emit('close')">取消</el-button>
      <el-button type="primary" @click="emit('check')">已扫码</el-button>
    </div>
  </div>
</template>
