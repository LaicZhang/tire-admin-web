<script setup lang="ts">
import { PureTableBar } from "@/components/RePureTableBar";
import { useRenderIcon } from "@/components/ReIcon/src/hooks";
import Download from "~icons/ep/download";
import Printer from "~icons/ep/printer";
import type { FundFlow } from "../types";

interface PaginationState {
  total: number;
  pageSize: number;
  currentPage: number;
  background?: boolean;
}

interface Props {
  loading: boolean;
  columns: TableColumnList;
  data: FundFlow[];
  pagination: PaginationState;
}

defineProps<Props>();

const emit = defineEmits<{
  (e: "refresh"): void;
  (e: "export"): void;
  (e: "print"): void;
  (e: "page-size-change", value: number): void;
  (e: "page-current-change", value: number): void;
}>();

const formatMoney = (amount?: number): string => {
  if (amount === undefined || amount === null) return "-";
  return (amount / 100).toFixed(2);
};
</script>

<template>
  <PureTableBar
    title="资金流水明细"
    :columns="columns"
    @refresh="emit('refresh')"
  >
    <template #buttons>
      <el-button :icon="useRenderIcon(Download)" @click="emit('export')">
        导出
      </el-button>
      <el-button :icon="useRenderIcon(Printer)" @click="emit('print')">
        打印
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
        :pagination="pagination"
        :paginationSmall="size === 'small'"
        :header-cell-style="{
          background: 'var(--el-fill-color-light)',
          color: 'var(--el-text-color-primary)'
        }"
        @page-size-change="val => emit('page-size-change', val)"
        @page-current-change="val => emit('page-current-change', val)"
      >
        <template #direction="{ row }">
          <el-tag
            :type="row.direction === 'IN' ? 'success' : 'danger'"
            size="small"
          >
            {{ row.direction === "IN" ? "收入" : "支出" }}
          </el-tag>
        </template>
        <template #amount="{ row }">
          <span
            :class="row.direction === 'IN' ? 'text-green-600' : 'text-red-500'"
            class="font-medium"
          >
            {{ row.direction === "IN" ? "+" : "-"
            }}{{ formatMoney(row.amount) }}
          </span>
        </template>
      </pure-table>
    </template>
  </PureTableBar>
</template>
