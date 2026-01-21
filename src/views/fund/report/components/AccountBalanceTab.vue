<script setup lang="ts">
import { PureTableBar } from "@/components/RePureTableBar";
import { useRenderIcon } from "@/components/ReIcon/src/hooks";
import Download from "~icons/ep/download";
import type { AccountBalance } from "../types";

interface Props {
  loading: boolean;
  columns: TableColumnList;
  data: AccountBalance[];
}

defineProps<Props>();

const emit = defineEmits<{
  (e: "refresh"): void;
  (e: "export"): void;
}>();

const formatMoney = (amount?: number): string => {
  if (amount === undefined || amount === null) return "-";
  return (amount / 100).toFixed(2);
};
</script>

<template>
  <PureTableBar
    title="账户余额统计"
    :columns="columns"
    @refresh="emit('refresh')"
  >
    <template #buttons>
      <el-button :icon="useRenderIcon(Download)" @click="emit('export')">
        导出
      </el-button>
    </template>
    <template v-slot="{ size, dynamicColumns }">
      <pure-table
        border
        align-whole="center"
        showOverflowTooltip
        table-layout="auto"
        :loading="loading"
        :size="size"
        :data="data"
        :columns="dynamicColumns"
        :header-cell-style="{
          background: 'var(--el-fill-color-light)',
          color: 'var(--el-text-color-primary)'
        }"
      >
        <template #income="{ row }">
          <span class="text-green-600 font-medium"
            >+{{ formatMoney(row.periodIncome) }}</span
          >
        </template>
        <template #expense="{ row }">
          <span class="text-red-500 font-medium"
            >-{{ formatMoney(row.periodExpense) }}</span
          >
        </template>
      </pure-table>
    </template>
  </PureTableBar>
</template>
