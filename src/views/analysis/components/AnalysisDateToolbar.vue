<script setup lang="ts">
import { computed } from "vue";
import { useRenderIcon } from "@/components/ReIcon/src/hooks";
import Refresh from "~icons/ep/refresh";
import {
  analysisDateShortcuts,
  type AnalysisDateRange,
  type AnalysisGroupBy
} from "../shared";

const props = withDefaults(
  defineProps<{
    dateRange: AnalysisDateRange;
    groupBy?: AnalysisGroupBy;
    showGroupBy?: boolean;
    loading?: boolean;
  }>(),
  {
    groupBy: "day",
    showGroupBy: true,
    loading: false
  }
);

const emit = defineEmits<{
  "update:dateRange": [AnalysisDateRange];
  "update:groupBy": [AnalysisGroupBy];
  change: [];
  refresh: [];
}>();

const groupByOptions: Array<{ label: string; value: AnalysisGroupBy }> = [
  { label: "日", value: "day" },
  { label: "周", value: "week" },
  { label: "月", value: "month" }
];

const shortcuts = computed(() =>
  analysisDateShortcuts.map(item => ({
    text: item.text,
    value: item.value
  }))
);

function onDateChange(value: AnalysisDateRange) {
  emit("update:dateRange", value);
  emit("change");
}

function onGroupByChange(value: AnalysisGroupBy) {
  emit("update:groupBy", value);
  emit("change");
}
</script>

<template>
  <div class="flex flex-wrap items-center gap-3">
    <el-date-picker
      :model-value="props.dateRange"
      type="daterange"
      range-separator="至"
      start-placeholder="开始日期"
      end-placeholder="结束日期"
      :shortcuts="shortcuts"
      :clearable="false"
      @update:model-value="onDateChange"
    />
    <el-segmented
      v-if="props.showGroupBy"
      :model-value="props.groupBy"
      :options="groupByOptions"
      @change="onGroupByChange"
    />
    <slot />
    <el-button
      :icon="useRenderIcon(Refresh)"
      circle
      :loading="props.loading"
      @click="emit('refresh')"
    />
  </div>
</template>
