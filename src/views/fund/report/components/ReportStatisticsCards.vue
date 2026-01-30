<script setup lang="ts">
import { computed } from "vue";
import { fenToYuanOrDash as formatMoney } from "@/utils/formatMoney";

interface Statistics {
  totalIncome: number;
  totalExpense: number;
  netBalance: number;
  totalReceivable: number;
  totalPayable: number;
}

interface Props {
  activeTab: string;
  statistics: Statistics;
}

const props = defineProps<Props>();

const netValue = computed(() => {
  return props.activeTab === "debt"
    ? props.statistics.totalReceivable - props.statistics.totalPayable
    : props.statistics.netBalance;
});
</script>

<template>
  <div class="statistics-cards mb-4 flex gap-4 px-4">
    <el-card shadow="never" class="flex-1">
      <div class="text-gray-500 text-sm">
        {{ activeTab === "debt" ? "应收合计" : "收入合计" }}
      </div>
      <div class="text-xl font-bold text-green-600">
        ¥{{
          formatMoney(
            activeTab === "debt"
              ? statistics.totalReceivable
              : statistics.totalIncome
          )
        }}
      </div>
    </el-card>
    <el-card shadow="never" class="flex-1">
      <div class="text-gray-500 text-sm">
        {{ activeTab === "debt" ? "应付合计" : "支出合计" }}
      </div>
      <div class="text-xl font-bold text-red-500">
        ¥{{
          formatMoney(
            activeTab === "debt"
              ? statistics.totalPayable
              : statistics.totalExpense
          )
        }}
      </div>
    </el-card>
    <el-card shadow="never" class="flex-1">
      <div class="text-gray-500 text-sm">
        {{ activeTab === "debt" ? "净欠款" : "净额" }}
      </div>
      <div
        class="text-xl font-bold"
        :class="netValue >= 0 ? 'text-green-600' : 'text-red-500'"
      >
        ¥{{ formatMoney(netValue) }}
      </div>
    </el-card>
  </div>
</template>

<style scoped lang="scss">
.statistics-cards {
  :deep(.el-card__body) {
    padding: 16px;
  }
}
</style>
