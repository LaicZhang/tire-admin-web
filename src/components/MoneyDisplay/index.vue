<script setup lang="ts">
import { computed } from "vue";
import type { MoneyDisplayProps } from "./types";
import { fenToYuanNumber } from "@/utils/formatMoney";

defineOptions({
  name: "MoneyDisplay"
});

const props = withDefaults(defineProps<MoneyDisplayProps>(), {
  unit: "yuan",
  showSymbol: true,
  precision: 2,
  symbol: "¥",
  emptyText: "-"
});

const displayValue = computed(() => {
  if (props.value === null || props.value === undefined) {
    return props.emptyText;
  }

  const yuan =
    props.unit === "fen" ? fenToYuanNumber(props.value) : props.value;
  const formatted = yuan.toFixed(props.precision);

  return props.showSymbol ? `${props.symbol}${formatted}` : formatted;
});
</script>

<template>
  <span class="money-display">{{ displayValue }}</span>
</template>

<style scoped>
.money-display {
  font-variant-numeric: tabular-nums;
}
</style>
