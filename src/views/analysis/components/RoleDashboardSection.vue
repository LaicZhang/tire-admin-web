<script setup lang="ts">
import { nextTick, onMounted, onUnmounted, ref, watch } from "vue";
import { useRouter } from "vue-router";
import type { EChartsCoreOption, EChartsType } from "echarts/core";
import type { RoleDashboardCard, RoleDashboardSection } from "@/api/dashboard";
import { getEcharts } from "@/utils/echarts";

defineOptions({
  name: "RoleDashboardSection"
});

const props = defineProps<{
  section: RoleDashboardSection;
}>();

const router = useRouter();
const chartRef = ref<HTMLElement | null>(null);
let chartInstance: EChartsType | null = null;

function formatCardValue(card: RoleDashboardCard) {
  if (card.key.includes("amount") || card.key.includes("value")) {
    return `¥${card.value}`;
  }
  return card.value;
}

function buildTrendOption(section: RoleDashboardSection): EChartsCoreOption {
  const hasAmount = section.trend.some(item => item.amount !== undefined);

  return {
    tooltip: { trigger: "axis" },
    grid: { left: 36, right: 16, top: 36, bottom: 24 },
    xAxis: {
      type: "category",
      data: section.trend.map(item => item.label)
    },
    yAxis: hasAmount
      ? [
          {
            type: "value",
            axisLabel: {
              formatter: (value: number) => `${(value / 100).toFixed(0)}`
            }
          },
          { type: "value" }
        ]
      : [{ type: "value" }],
    series: hasAmount
      ? [
          {
            name: "金额",
            type: "bar",
            data: section.trend.map(item => Number(item.amount ?? 0)),
            itemStyle: { color: "#2563eb" }
          },
          {
            name: "数量",
            type: "line",
            yAxisIndex: 1,
            smooth: true,
            data: section.trend.map(item => item.count ?? 0),
            itemStyle: { color: "#16a34a" }
          }
        ]
      : [
          {
            name: "数值",
            type: "line",
            smooth: true,
            areaStyle: { color: "rgba(59, 130, 246, 0.16)" },
            data: section.trend.map(item => item.value ?? 0),
            itemStyle: { color: "#2563eb" }
          }
        ]
  };
}

async function renderChart() {
  if (!chartRef.value) return;
  const echarts = await getEcharts();
  if (!chartInstance) {
    chartInstance = echarts.init(chartRef.value);
  }
  chartInstance.setOption(buildTrendOption(props.section));
}

function navigateToSection() {
  router.push(props.section.targetPath);
}

function handleResize() {
  chartInstance?.resize();
}

watch(
  () => props.section,
  async () => {
    await nextTick();
    await renderChart();
  },
  { deep: true }
);

onMounted(async () => {
  await renderChart();
  window.addEventListener("resize", handleResize);
});

onUnmounted(() => {
  window.removeEventListener("resize", handleResize);
  chartInstance?.dispose();
  chartInstance = null;
});
</script>

<template>
  <el-card class="role-dashboard-section">
    <template #header>
      <div class="flex items-center justify-between">
        <span class="font-bold">{{ section.title }}</span>
        <el-button link type="primary" @click="navigateToSection">
          查看详情
        </el-button>
      </div>
    </template>

    <div class="mb-4 grid gap-3 md:grid-cols-4">
      <div
        v-for="card in section.summaryCards"
        :key="card.key"
        class="rounded-xl bg-slate-50 p-4"
      >
        <div class="text-xs text-slate-500">{{ card.title }}</div>
        <div class="mt-2 text-xl font-semibold text-slate-900">
          {{ formatCardValue(card) }}
        </div>
      </div>
    </div>

    <div v-if="section.alerts.length" class="mb-4 flex flex-wrap gap-2">
      <el-tag
        v-for="alert in section.alerts"
        :key="alert.key"
        size="small"
        :type="alert.level === 'danger' ? 'danger' : alert.level"
      >
        {{ alert.label }} {{ alert.value }}
      </el-tag>
    </div>

    <div ref="chartRef" class="h-72" />

    <el-table
      v-if="section.ranking.length"
      :data="section.ranking"
      size="small"
      class="mt-4"
    >
      <el-table-column prop="rank" label="#" width="60" />
      <el-table-column prop="name" label="名称" />
      <el-table-column label="指标" min-width="140">
        <template #default="{ row }">
          <span>{{ row.amount ?? row.value ?? row.count ?? "-" }}</span>
        </template>
      </el-table-column>
    </el-table>
  </el-card>
</template>
