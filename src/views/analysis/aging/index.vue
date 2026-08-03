<script setup lang="ts">
import { computed, nextTick, onMounted, onUnmounted, ref } from "vue";
import { getReceivableAgingApi, getPayableAgingApi } from "@/api/analysis";
import { message } from "@/utils/message";
import type { EChartsType } from "echarts/core";
import { getEcharts } from "@/utils/echarts";
import AnalysisDateToolbar from "../components/AnalysisDateToolbar.vue";
import {
  createDefaultAnalysisFilterState,
  inferGroupBy,
  toRequiredDateParams,
  type AnalysisGroupBy
} from "../shared";
import { receivableColumns, payableColumns } from "./columns";

defineOptions({
  name: "AnalysisAging"
});

interface BucketItem {
  label: string;
  amount: string;
  count: number;
}

interface DetailItem {
  name: string;
  orderNumber?: string;
  orderDate?: string;
  dueAmount: string;
  agingDays: number;
  agingBucket?: string;
}

interface AgingView {
  totalAmount: string;
  buckets: BucketItem[];
  details: DetailItem[];
}

const loading = ref(false);
const activeTab = ref<"receivable" | "payable">("receivable");

const agingDaysPreset = ref("30,60,90");
const agingDaysOptions = [
  { label: "30 / 60 / 90", value: "30,60,90" },
  { label: "15 / 30 / 60 / 90", value: "15,30,60,90" },
  { label: "7 / 30 / 90", value: "7,30,90" },
  { label: "60 / 90 / 180", value: "60,90,180" }
];

const agingDays = computed(() =>
  agingDaysPreset.value
    .split(",")
    .map(s => Number(s.trim()))
    .filter(n => Number.isFinite(n) && n > 0)
);

const filterState = ref(createDefaultAnalysisFilterState());
const dateRange = computed({
  get: () => filterState.value.dateRange,
  set: v => {
    filterState.value = {
      ...filterState.value,
      dateRange: v,
      groupBy: inferGroupBy(v)
    };
  }
});
const groupBy = computed({
  get: () => filterState.value.groupBy,
  set: (v: AnalysisGroupBy) => {
    filterState.value = { ...filterState.value, groupBy: v };
  }
});

const dateParams = computed(() => ({
  ...toRequiredDateParams(dateRange.value),
  agingDays: agingDays.value
}));

const receivableData = ref<AgingView>({
  totalAmount: "0",
  buckets: [],
  details: []
});
const payableData = ref<AgingView>({
  totalAmount: "0",
  buckets: [],
  details: []
});

const chartRefReceivable = ref<HTMLElement | null>(null);
const chartRefPayable = ref<HTMLElement | null>(null);
const topChartRefReceivable = ref<HTMLElement | null>(null);
const topChartRefPayable = ref<HTMLElement | null>(null);
let chartInstanceReceivable: EChartsType | null = null;
let chartInstancePayable: EChartsType | null = null;
let topChartReceivable: EChartsType | null = null;
let topChartPayable: EChartsType | null = null;

function formatAmount(val: string | number) {
  const num = Number(val) / 100;
  return num.toLocaleString("zh-CN", { minimumFractionDigits: 2 });
}

function fenToYuan(val: string | number | null | undefined): number {
  const n = Number(String(val ?? "0").replace(/,/g, ""));
  return Number.isFinite(n) ? n / 100 : 0;
}

function topOverdue(details: DetailItem[], limit = 10): DetailItem[] {
  return [...details]
    .sort((a, b) => fenToYuan(b.dueAmount) - fenToYuan(a.dueAmount))
    .slice(0, limit);
}

async function ensureChart(
  existing: EChartsType | null,
  el: HTMLElement | null
): Promise<EChartsType | null> {
  if (!el) return existing;
  if (existing) return existing;
  const echarts = await getEcharts();
  return echarts.init(el);
}

async function updateBucketCharts(type: "receivable" | "payable") {
  const isReceivable = type === "receivable";
  const buckets = isReceivable
    ? receivableData.value.buckets
    : payableData.value.buckets;
  const refDom = isReceivable
    ? chartRefReceivable.value
    : chartRefPayable.value;

  let instance = isReceivable ? chartInstanceReceivable : chartInstancePayable;
  instance = await ensureChart(instance, refDom);
  if (isReceivable) chartInstanceReceivable = instance;
  else chartInstancePayable = instance;
  if (!instance || !buckets.length) return;

  // C1: stacked single-category bar (bucket segments) + keep pie legend via dual series layout
  instance.setOption(
    {
      title: {
        text: "账龄桶分布（堆叠 + 饼）",
        left: "center",
        textStyle: { fontSize: 13 }
      },
      tooltip: { trigger: "item" },
      legend: { bottom: 0 },
      grid: {
        left: "4%",
        right: "55%",
        top: "16%",
        bottom: "18%",
        containLabel: true
      },
      xAxis: {
        type: "category",
        data: ["金额"]
      },
      yAxis: {
        type: "value",
        name: "元",
        axisLabel: {
          formatter: (v: number) =>
            v >= 10000 ? `${(v / 10000).toFixed(1)}万` : String(v)
        }
      },
      series: [
        ...buckets.map((item, idx) => ({
          name: item.label,
          type: "bar" as const,
          stack: "aging",
          emphasis: { focus: "series" as const },
          data: [fenToYuan(item.amount)],
          itemStyle: {
            color: ["#22c55e", "#eab308", "#f97316", "#ef4444", "#7f1d1d"][
              idx % 5
            ]
          }
        })),
        {
          name: "占比",
          type: "pie",
          radius: ["28%", "42%"],
          center: ["78%", "48%"],
          avoidLabelOverlap: true,
          label: { formatter: "{b}\n{d}%" },
          data: buckets.map(item => ({
            value: fenToYuan(item.amount),
            name: item.label
          }))
        }
      ]
    },
    true
  );
}

async function updateTopChart(type: "receivable" | "payable") {
  const isReceivable = type === "receivable";
  const details = isReceivable
    ? receivableData.value.details
    : payableData.value.details;
  const refDom = isReceivable
    ? topChartRefReceivable.value
    : topChartRefPayable.value;
  let instance = isReceivable ? topChartReceivable : topChartPayable;
  instance = await ensureChart(instance, refDom);
  if (isReceivable) topChartReceivable = instance;
  else topChartPayable = instance;
  if (!instance) return;

  const top = topOverdue(details, 10);
  const labels = top.map(d => d.name || "-").reverse();
  const amounts = top.map(d => fenToYuan(d.dueAmount)).reverse();

  instance.setOption(
    {
      title: {
        text: "Top 逾期金额（C2）",
        left: "center",
        textStyle: { fontSize: 13 }
      },
      tooltip: {
        trigger: "axis",
        axisPointer: { type: "shadow" },
        formatter: (params: unknown) => {
          const list = Array.isArray(params) ? params : [params];
          const item = list[0] as { name?: string; value?: number } | undefined;
          if (!item) return "";
          return `${item.name}<br/>¥${Number(item.value ?? 0).toLocaleString(
            "zh-CN",
            { minimumFractionDigits: 2 }
          )}`;
        }
      },
      grid: {
        left: "3%",
        right: "8%",
        top: "16%",
        bottom: "3%",
        containLabel: true
      },
      xAxis: { type: "value", name: "元" },
      yAxis: {
        type: "category",
        data: labels,
        axisLabel: { width: 100, overflow: "truncate" }
      },
      series: [
        {
          type: "bar",
          data: amounts,
          itemStyle: { color: isReceivable ? "#ef4444" : "#0d9488" }
        }
      ]
    },
    true
  );
}

const getReceivable = async () => {
  try {
    const { data, code } = await getReceivableAgingApi(dateParams.value);
    if (code === 200 && data) {
      receivableData.value = {
        totalAmount: data.totalAmount || "0",
        buckets: data.buckets || [],
        details: data.details || []
      };
      await nextTick();
      await updateBucketCharts("receivable");
      await updateTopChart("receivable");
    }
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "获取应收账龄失败";
    message(msg, { type: "error" });
  }
};

const getPayable = async () => {
  try {
    const { data, code } = await getPayableAgingApi(dateParams.value);
    if (code === 200 && data) {
      payableData.value = {
        totalAmount: data.totalAmount || "0",
        buckets: data.buckets || [],
        details: data.details || []
      };
      await nextTick();
      await updateBucketCharts("payable");
      await updateTopChart("payable");
    }
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "获取应付账龄失败";
    message(msg, { type: "error" });
  }
};

const loadData = async () => {
  loading.value = true;
  try {
    await Promise.all([getReceivable(), getPayable()]);
  } catch (error: unknown) {
    const errorMsg =
      error instanceof Error ? error.message : "加载账龄数据失败";
    message(errorMsg, { type: "error" });
  } finally {
    loading.value = false;
  }
};

const handleTabChange = () => {
  nextTick(() => {
    if (activeTab.value === "receivable") {
      chartInstanceReceivable?.resize();
      topChartReceivable?.resize();
      void updateBucketCharts("receivable");
      void updateTopChart("receivable");
    } else {
      chartInstancePayable?.resize();
      topChartPayable?.resize();
      void updateBucketCharts("payable");
      void updateTopChart("payable");
    }
  });
};

const handleResize = () => {
  chartInstanceReceivable?.resize();
  chartInstancePayable?.resize();
  topChartReceivable?.resize();
  topChartPayable?.resize();
};

onMounted(() => {
  void loadData();
  window.addEventListener("resize", handleResize);
});

onUnmounted(() => {
  window.removeEventListener("resize", handleResize);
  chartInstanceReceivable?.dispose();
  chartInstancePayable?.dispose();
  topChartReceivable?.dispose();
  topChartPayable?.dispose();
  chartInstanceReceivable = null;
  chartInstancePayable = null;
  topChartReceivable = null;
  topChartPayable = null;
});
</script>

<template>
  <div class="main p-4">
    <el-card class="mb-4">
      <div class="flex flex-wrap items-center justify-between gap-3">
        <span class="font-bold text-lg">账龄分析</span>
        <div class="flex flex-wrap items-center gap-3">
          <el-select
            v-model="agingDaysPreset"
            class="w-[200px]"
            placeholder="账龄桶"
            @change="loadData"
          >
            <el-option
              v-for="opt in agingDaysOptions"
              :key="opt.value"
              :label="opt.label"
              :value="opt.value"
            />
          </el-select>
          <AnalysisDateToolbar
            v-model:date-range="dateRange"
            v-model:group-by="groupBy"
            :show-group-by="false"
            :loading="loading"
            @change="loadData"
            @refresh="loadData"
          />
        </div>
      </div>
    </el-card>

    <el-card v-loading="loading">
      <el-tabs v-model="activeTab" @tab-change="handleTabChange">
        <el-tab-pane label="应收账款分析 (客户欠款)" name="receivable">
          <el-row :gutter="16" class="mb-4">
            <el-col :span="12">
              <div ref="chartRefReceivable" class="h-80 w-full" />
              <div class="text-center mt-2">
                <span class="text-gray-500">总应收金额: </span>
                <span class="text-xl font-bold text-red-500"
                  >¥{{ formatAmount(receivableData.totalAmount) }}</span
                >
              </div>
            </el-col>
            <el-col :span="12">
              <div ref="topChartRefReceivable" class="h-80 w-full" />
            </el-col>
          </el-row>
          <pure-table
            :data="receivableData.details"
            :columns="receivableColumns"
            height="400"
            stripe
            border
          />
        </el-tab-pane>

        <el-tab-pane label="应付账款分析 (欠供应商)" name="payable">
          <el-row :gutter="16" class="mb-4">
            <el-col :span="12">
              <div ref="chartRefPayable" class="h-80 w-full" />
              <div class="text-center mt-2">
                <span class="text-gray-500">总应付金额: </span>
                <span class="text-xl font-bold text-green-500"
                  >¥{{ formatAmount(payableData.totalAmount) }}</span
                >
              </div>
            </el-col>
            <el-col :span="12">
              <div ref="topChartRefPayable" class="h-80 w-full" />
            </el-col>
          </el-row>
          <pure-table
            :data="payableData.details"
            :columns="payableColumns"
            height="400"
            stripe
            border
          />
        </el-tab-pane>
      </el-tabs>
    </el-card>
  </div>
</template>
