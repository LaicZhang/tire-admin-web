<script setup lang="ts">
import { nextTick, onMounted, onUnmounted, ref, watch } from "vue";
import type { EChartsType } from "echarts/core";
import { getEcharts } from "@/utils/echarts";

defineOptions({
  name: "ReportSparkline"
});

export type SparklinePoint = {
  label: string;
  value: number;
};

const props = withDefaults(
  defineProps<{
    title?: string;
    seriesName?: string;
    points: SparklinePoint[];
    chartType?: "line" | "bar";
    height?: string;
    color?: string;
    valuePrefix?: string;
    loading?: boolean;
  }>(),
  {
    title: "趋势",
    seriesName: "数值",
    chartType: "line",
    height: "220px",
    color: "#2563eb",
    valuePrefix: "",
    loading: false
  }
);

const chartRef = ref<HTMLElement | null>(null);
let chart: EChartsType | null = null;

async function render() {
  if (!chartRef.value) return;
  if (!chart) {
    const echarts = await getEcharts();
    chart = echarts.init(chartRef.value);
  }
  const labels = props.points.map(p => p.label);
  const values = props.points.map(p => p.value);
  chart.setOption(
    {
      grid: {
        left: "2%",
        right: "3%",
        top: "12%",
        bottom: "8%",
        containLabel: true
      },
      tooltip: {
        trigger: "axis",
        formatter: (params: unknown) => {
          const list = Array.isArray(params) ? params : [params];
          const item = list[0] as
            | { name?: string; value?: number; seriesName?: string }
            | undefined;
          if (!item) return "";
          const val = Number(item.value ?? 0);
          return `${item.name}<br/>${item.seriesName || props.seriesName}：${
            props.valuePrefix
          }${val.toLocaleString("zh-CN", { maximumFractionDigits: 2 })}`;
        }
      },
      xAxis: {
        type: "category",
        data: labels,
        boundaryGap: props.chartType === "bar",
        axisLabel: {
          hideOverlap: true,
          fontSize: 11
        }
      },
      yAxis: {
        type: "value",
        splitNumber: 3,
        axisLabel: { fontSize: 11 }
      },
      series: [
        {
          name: props.seriesName,
          type: props.chartType,
          smooth: props.chartType === "line",
          showSymbol: labels.length <= 12,
          areaStyle:
            props.chartType === "line"
              ? { opacity: 0.12, color: props.color }
              : undefined,
          itemStyle: { color: props.color },
          lineStyle: { width: 2, color: props.color },
          data: values
        }
      ]
    },
    true
  );
}

function handleResize() {
  chart?.resize();
}

watch(
  () => [props.points, props.chartType, props.color, props.seriesName],
  async () => {
    await nextTick();
    await render();
  },
  { deep: true }
);

onMounted(async () => {
  await nextTick();
  await render();
  window.addEventListener("resize", handleResize);
});

onUnmounted(() => {
  window.removeEventListener("resize", handleResize);
  chart?.dispose();
  chart = null;
});
</script>

<template>
  <el-card v-loading="loading" shadow="never" class="report-sparkline">
    <template v-if="title" #header>
      <div class="flex items-center justify-between">
        <span class="font-bold">{{ title }}</span>
        <el-tag size="small" type="info" effect="plain">sparkline</el-tag>
      </div>
    </template>
    <div
      v-if="!points.length"
      class="flex items-center justify-center text-gray-400 text-sm"
      :style="{ height }"
    >
      暂无趋势数据
    </div>
    <div v-else ref="chartRef" class="w-full" :style="{ height }" />
  </el-card>
</template>
