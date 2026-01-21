<script setup lang="ts">
import type { ImportResult } from "./types";

interface Props {
  result: ImportResult | null;
}

defineProps<Props>();
</script>

<template>
  <div v-if="result" class="result-panel mb-4">
    <el-alert
      :type="result.failed === 0 ? 'success' : 'warning'"
      :closable="false"
    >
      <template #title>
        导入完成：成功 {{ result.success }} 条，失败 {{ result.failed }} 条
      </template>
    </el-alert>

    <div v-if="result.errors.length > 0" class="mt-4">
      <h5 class="text-sm font-medium mb-2 text-red-500">错误详情：</h5>
      <el-scrollbar max-height="150px">
        <ul class="text-xs text-red-500">
          <li v-for="(error, index) in result.errors" :key="index">
            {{ error }}
          </li>
        </ul>
      </el-scrollbar>
    </div>
  </div>
</template>
