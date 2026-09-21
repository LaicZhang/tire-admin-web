<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from "vue";
import type { EChartsCoreOption, EChartsType } from "echarts/core";
import {
  getSalesProvinceApi,
  getSalesRegionApi,
  getSalesSummaryByDimensionApi,
  type ProvinceSalesItem,
  type RegionSalesItem,
  type SalesDimensionGroupBy
} from "@/api/analysis";
import { getEcharts } from "@/utils/echarts";
import { toChartNumber } from "../transformers";
import { handleApiError } from "@/utils";

defineOptions({
  name: "SalesHotspotCharts"
});

const props = defineProps<{
  startDate?: string;
  endDate?: string;
  /** time grain for region trend heatmap */
  groupBy?: "day" | "week" | "month";
  /** business dimension for B2 bar (URL key: dim) */
  dimension?: SalesDimensionGroupBy;
}>();

const emit = defineEmits<{
  (e: "update:dimension", value: SalesDimensionGroupBy): void;
}>();

const loading = ref(false);
const regionSummary = ref<RegionSalesItem[]>([]);
const regionTrend = ref<Array<{ period: string; regions: RegionSalesItem[] }>>(
  []
);
const provinceSummary = ref<ProvinceSalesItem[]>([]);
const dimensionItems = ref<
  Array<{ name: string; amount: string; quantity: number; count: number }>
>([]);

const regionBarRef = ref<HTMLElement | null>(null);
const regionHeatRef = ref<HTMLElement | null>(null);
const provinceBarRef = ref<HTMLElement | null>(null);
const dimensionBarRef = ref<HTMLElement | null>(null);

let regionBarChart: EChartsType | null = null;
let regionHeatChart: EChartsType | null = null;
let provinceBarChart: EChartsType | null = null;
let dimensionBarChart: EChartsType | null = null;

const dim = computed({
  get: () => props.dimension ?? "tire",
  set: (v: SalesDimensionGroupBy) => emit("update:dimension", v)
});

const dateParams = computed(() => ({
  startDate: props.startDate,
  endDate: props.endDate
}));

function formatYuan(val: number): string {
  return val.toLocaleString("zh-CN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
}

function buildHorizontalBarOption(
  labels: string[],
  amounts: number[],
  seriesName: string
): EChartsCoreOption {
  return {
    tooltip: {
      trigger: "axis",
      axisPointer: { type: "shadow" },
      formatter: (params: unknown) => {
        const list = Array.isArray(params) ? params : [params];
        const item = list[0] as { name?: string; value?: number } | undefined;
        if (!item) return "";
        return `${item.name}<br/>${seriesName}：¥${formatYuan(Number(item.value ?? 0))}`;
      }
    },
    grid: {
      left: "3%",
      right: "8%",
      bottom: "3%",
      top: "8%",
      containLabel: true
    },
    xAxis: {
      type: "value",
      name: "金额(元)",
      axisLabel: {
        formatter: (val: number) =>
          val >= 10000 ? `${(val / 10000).toFixed(1)}万` : String(val)
      }
    },
    yAxis: {
      type: "category",
      data: labels,
      axisLabel: { width: 96, overflow: "truncate" }
    },
    series: [
      {
        name: seriesName,
        type: "bar",
        data: amounts,
        itemStyle: { color: "#2563eb" },
        label: {
          show: amounts.length <= 12,
          position: "right",
          formatter: (p: { value?: number }) => formatYuan(Number(p.value ?? 0))
        }
      }
    ]
  };
}

function buildHeatmapOption(): EChartsCoreOption {
  const periods = regionTrend.value.map(t => t.period);
  const regionNames = Array.from(
    new Set(
      regionTrend.value.flatMap(t =>
        t.regions.map(r => r.regionName || "未分配区域")
      )
    )
  );
  if (periods.length === 0 || regionNames.length === 0) {
    return {
      title: {
        text: "暂无区域×周期热力数据",
        left: "center",
        top: "middle",
        textStyle: { color: "#94a3b8", fontSize: 13, fontWeight: "normal" }
      }
    };
  }

  const nameIndex = new Map(regionNames.map((n, i) => [n, i]));
  const data: Array<[number, number, number]> = [];
  let max = 0;
  regionTrend.value.forEach((row, x) => {
    for (const r of row.regions) {
      const y = nameIndex.get(r.regionName || "未分配区域");
      if (y == null) continue;
      const v = toChartNumber(r.amount);
      max = Math.max(max, v);
      data.push([x, y, v]);
    }
  });

  return {
    tooltip: {
      position: "top",
      formatter: (p: { data?: [number, number, number] }) => {
        const d = p.data;
        if (!d) return "";
        return `${periods[d[0]]} · ${regionNames[d[1]]}<br/>¥${formatYuan(d[2])}`;
      }
    },
    grid: {
      left: "3%",
      right: "8%",
      bottom: "12%",
      top: "8%",
      containLabel: true
    },
    xAxis: {
      type: "category",
      data: periods,
      splitArea: { show: true }
    },
    yAxis: {
      type: "category",
      data: regionNames,
      splitArea: { show: true },
      axisLabel: { width: 88, overflow: "truncate" }
    },
    visualMap: {
      min: 0,
      max: max || 1,
      calculable: true,
      orient: "horizontal",
      left: "center",
      bottom: 0,
      inRange: { color: ["#eff6ff", "#2563eb", "#1e3a8a"] }
    },
    series: [
      {
        name: "区域销售额",
        type: "heatmap",
        data,
        label: { show: false },
        emphasis: {
          itemStyle: { shadowBlur: 8, shadowColor: "rgba(0,0,0,0.25)" }
        }
      }
    ]
  };
}

async function ensureChart(
  el: HTMLElement | null,
  existing: EChartsType | null
): Promise<EChartsType | null> {
  if (!el) return existing;
  if (existing) return existing;
  const echarts = await getEcharts();
  return echarts.init(el);
}

async function renderCharts() {
  regionBarChart = await ensureChart(regionBarRef.value, regionBarChart);
  regionHeatChart = await ensureChart(regionHeatRef.value, regionHeatChart);
  provinceBarChart = await ensureChart(provinceBarRef.value, provinceBarChart);
  dimensionBarChart = await ensureChart(
    dimensionBarRef.value,
    dimensionBarChart
  );

  const regionLabels = regionSummary.value.map(
    r => r.regionName || "未分配区域"
  );
  const regionAmounts = regionSummary.value.map(r => toChartNumber(r.amount));
  regionBarChart?.setOption(
    buildHorizontalBarOption(
      regionLabels.reverse(),
      regionAmounts.reverse(),
      "区域销售"
    ),
    true
  );

  regionHeatChart?.setOption(buildHeatmapOption(), true);

  const provinceLabels = provinceSummary.value.map(p => p.province);
  const provinceAmounts = provinceSummary.value.map(p =>
    toChartNumber(p.amount)
  );
  provinceBarChart?.setOption(
    buildHorizontalBarOption(
      provinceLabels.reverse(),
      provinceAmounts.reverse(),
      "省份销售"
    ),
    true
  );

  const dimLabels = dimensionItems.value.map(i => i.name);
  const dimAmounts = dimensionItems.value.map(i => toChartNumber(i.amount));
  dimensionBarChart?.setOption(
    buildHorizontalBarOption(
      dimLabels.reverse(),
      dimAmounts.reverse(),
      "维度销售"
    ),
    true
  );
}

async function loadRegion() {
  const { code, data } = await getSalesRegionApi({
    ...dateParams.value,
    groupBy: props.groupBy ?? "month"
  });
  if (code !== 200 || !data) {
    regionSummary.value = [];
    regionTrend.value = [];
    return;
  }
  regionSummary.value = data.summary ?? [];
  regionTrend.value = data.trend ?? [];
}

async function loadProvince() {
  const { code, data } = await getSalesProvinceApi(dateParams.value);
  if (code !== 200 || !data) {
    provinceSummary.value = [];
    return;
  }
  provinceSummary.value = data.summary ?? [];
}

async function loadDimension() {
  const { code, data } = await getSalesSummaryByDimensionApi({
    ...dateParams.value,
    groupBy: dim.value,
    limit: 15
  });
  if (code !== 200 || !data) {
    dimensionItems.value = [];
    return;
  }
  dimensionItems.value = (data.items ?? []).map(item => ({
    name: item.name,
    amount: item.amount,
    quantity: item.quantity,
    count: item.count
  }));
}

async function loadAll() {
  loading.value = true;
  try {
    await Promise.all([loadRegion(), loadProvince(), loadDimension()]);
    await renderCharts();
  } catch (error) {
    handleApiError(error, "加载区域/维度热点失败");
  } finally {
    loading.value = false;
  }
}

function handleResize() {
  regionBarChart?.resize();
  regionHeatChart?.resize();
  provinceBarChart?.resize();
  dimensionBarChart?.resize();
}

watch(
  () => [props.startDate, props.endDate, props.groupBy, props.dimension],
  () => {
    void loadAll();
  }
);

onMounted(() => {
  void loadAll();
  window.addEventListener("resize", handleResize);
});

onUnmounted(() => {
  window.removeEventListener("resize", handleResize);
  regionBarChart?.dispose();
  regionHeatChart?.dispose();
  provinceBarChart?.dispose();
  dimensionBarChart?.dispose();
  regionBarChart = null;
  regionHeatChart = null;
  provinceBarChart = null;
  dimensionBarChart = null;
});
</script>

<template>
  <div v-loading="loading" class="sales-hotspot">
    <el-row :gutter="16" class="mb-4">
      <el-col :xs="24" :lg="12">
        <el-card shadow="never">
          <template #header>
            <div class="flex items-center justify-between">
              <span class="font-bold">区域销售（B1a）</span>
              <el-tag size="small" type="info" effect="plain">水平 bar</el-tag>
            </div>
          </template>
          <div ref="regionBarRef" class="h-72" />
          <p
            v-if="!loading && regionSummary.length === 0"
            class="mt-2 text-center text-xs text-slate-400"
          >
            暂无区域数据；未分配客户归入「未分配区域」
          </p>
        </el-card>
      </el-col>
      <el-col :xs="24" :lg="12">
        <el-card shadow="never">
          <template #header>
            <div class="flex items-center justify-between">
              <span class="font-bold">区域×周期热力（B1b）</span>
              <el-tag size="small" type="info" effect="plain">heatmap</el-tag>
            </div>
          </template>
          <div ref="regionHeatRef" class="h-72" />
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="16" class="mb-4">
      <el-col :xs="24" :lg="12">
        <el-card shadow="never">
          <template #header>
            <div class="flex items-center justify-between">
              <span class="font-bold">省份销售（B1c）</span>
              <el-tag size="small" type="success" effect="plain">必达</el-tag>
            </div>
          </template>
          <div ref="provinceBarRef" class="h-72" />
          <p
            v-if="!loading && provinceSummary.length === 0"
            class="mt-2 text-center text-xs text-slate-400"
          >
            暂无省份字段数据；空省显示为「未填省」
          </p>
        </el-card>
      </el-col>
      <el-col :xs="24" :lg="12">
        <el-card shadow="never">
          <template #header>
            <div class="flex flex-wrap items-center justify-between gap-2">
              <span class="font-bold">销售维度构成（B2）</span>
              <el-segmented
                v-model="dim"
                size="small"
                :options="[
                  { label: '商品', value: 'tire' },
                  { label: '客户', value: 'customer' },
                  { label: '业务员', value: 'operator' },
                  { label: '供应商', value: 'provider' }
                ]"
              />
            </div>
          </template>
          <div ref="dimensionBarRef" class="h-72" />
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>
