<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import type { EChartsCoreOption, EChartsType } from "echarts/core";
import {
  getCustomerRankingApi,
  getOperatorRankingApi,
  getProductRankingApi,
  getSalesOrderTrackingApi,
  getSalesSummaryApi,
  getSalesTrendApi,
  type SalesOrderTrackingData
} from "@/api";
import { getStoreListApi, type Store } from "@/api/company/store";
import { useRenderIcon } from "@/components/ReIcon/src/hooks";
import { getEcharts } from "@/utils/echarts";
import { handleApiError } from "@/utils";
import Refresh from "~icons/ep/refresh";
import { useColumns } from "./columns";
import {
  buildAnalysisQuery,
  parseAnalysisFilters,
  toDateParams
} from "../shared";
import { buildTrackingSummaryCards } from "../transformers";

defineOptions({
  name: "AnalysisSales"
});

const { customerColumns, productColumns, operatorColumns, trackingColumns } =
  useColumns();
const route = useRoute();
const router = useRouter();

const loading = ref(false);
const chartRef = ref<HTMLElement | null>(null);
let chartInstance: EChartsType | null = null;
const stores = ref<Store[]>([]);

const dateRange = ref<[Date, Date] | null>(null);
const selectedStoreId = ref("");
const activeRankingTab = ref("customer");

const summaryData = ref({
  totalAmount: "0",
  totalOrders: 0,
  paidAmount: "0",
  unpaidAmount: "0",
  averageOrderValue: "0",
  completionRate: 0
});
const trendData = ref<Array<{ period: string; amount: string; count: number }>>(
  []
);
const customerRanking = ref<unknown[]>([]);
const productRanking = ref<unknown[]>([]);
const operatorRanking = ref<unknown[]>([]);
const trackingList = ref<SalesOrderTrackingData["list"]>([]);
const trackingSummary = ref<SalesOrderTrackingData["summary"]>({
  pending: 0,
  partial: 0,
  completed: 0
});

const shortcuts = [
  {
    text: "最近一周",
    value: () => {
      const end = new Date();
      const start = new Date();
      start.setTime(start.getTime() - 3600 * 1000 * 24 * 7);
      return [start, end];
    }
  },
  {
    text: "最近一个月",
    value: () => {
      const end = new Date();
      const start = new Date();
      start.setTime(start.getTime() - 3600 * 1000 * 24 * 30);
      return [start, end];
    }
  },
  {
    text: "最近三个月",
    value: () => {
      const end = new Date();
      const start = new Date();
      start.setTime(start.getTime() - 3600 * 1000 * 24 * 90);
      return [start, end];
    }
  }
];

const dateParams = computed(() => ({
  ...toDateParams(dateRange.value),
  storeId: selectedStoreId.value || undefined
}));

const trackingCards = computed(() =>
  buildTrackingSummaryCards(trackingSummary.value)
);

const exceptionTrackingList = computed(() =>
  trackingList.value.filter(item => item.trackingStatus !== "completed")
);

function formatAmount(val: string | number) {
  const num = Number(val);
  return num.toLocaleString("zh-CN", { minimumFractionDigits: 2 });
}

function buildTrendOption(): EChartsCoreOption {
  return {
    tooltip: { trigger: "axis", axisPointer: { type: "shadow" } },
    legend: { data: ["销售金额", "订单数"] },
    grid: { left: "3%", right: "4%", bottom: "3%", containLabel: true },
    xAxis: {
      type: "category",
      data: trendData.value.map(item => item.period)
    },
    yAxis: [
      {
        type: "value",
        name: "金额(元)",
        position: "left",
        axisLabel: {
          formatter: (val: number) => (val / 100).toLocaleString()
        }
      },
      {
        type: "value",
        name: "订单数",
        position: "right"
      }
    ],
    series: [
      {
        name: "销售金额",
        type: "bar",
        data: trendData.value.map(item => Number(item.amount)),
        itemStyle: { color: "#2563eb" }
      },
      {
        name: "订单数",
        type: "line",
        yAxisIndex: 1,
        smooth: true,
        data: trendData.value.map(item => item.count),
        itemStyle: { color: "#16a34a" }
      }
    ]
  };
}

async function updateChart() {
  if (!chartRef.value) return;
  if (!chartInstance) {
    const echarts = await getEcharts();
    chartInstance = echarts.init(chartRef.value);
  }
  chartInstance.setOption(buildTrendOption());
}

async function getSummary() {
  const { data, code } = await getSalesSummaryApi(dateParams.value);
  if (code !== 200 || !data) return;
  summaryData.value = {
    totalAmount: data.totalAmount || "0",
    totalOrders: data.totalOrders || 0,
    paidAmount: data.paidAmount || "0",
    unpaidAmount: data.unpaidAmount || "0",
    averageOrderValue: data.averageOrderValue || "0",
    completionRate: data.completionRate || 0
  };
}

async function getTrend() {
  const { data, code } = await getSalesTrendApi({
    ...dateParams.value,
    groupBy: "month"
  });
  if (code !== 200) return;
  trendData.value = data?.data ?? [];
  await updateChart();
}

async function getRankings() {
  const [customerRes, productRes, operatorRes] = await Promise.all([
    getCustomerRankingApi({ ...dateParams.value, limit: 10 }),
    getProductRankingApi({ ...dateParams.value, limit: 10, orderBy: "amount" }),
    getOperatorRankingApi({
      ...dateParams.value,
      limit: 10,
      orderBy: "amount"
    })
  ]);

  if (customerRes.code === 200) {
    customerRanking.value = customerRes.data?.items ?? [];
  }
  if (productRes.code === 200) {
    productRanking.value = productRes.data?.items ?? [];
  }
  if (operatorRes.code === 200) {
    operatorRanking.value = operatorRes.data?.items ?? [];
  }
}

async function getTracking() {
  const { data, code } = await getSalesOrderTrackingApi({
    ...dateParams.value,
    pageSize: 10
  });
  if (code !== 200 || !data) return;
  trackingList.value = data.list ?? [];
  trackingSummary.value = data.summary ?? {
    pending: 0,
    partial: 0,
    completed: 0
  };
}

async function loadData() {
  loading.value = true;
  try {
    await Promise.all([getSummary(), getTrend(), getRankings(), getTracking()]);
  } catch (error) {
    handleApiError(error, "加载销售分析失败");
  } finally {
    loading.value = false;
  }
}

async function loadStores() {
  const response = await getStoreListApi(1, { pageSize: 100 });
  stores.value = response.data?.list ?? [];
}

function applyRouteFilters() {
  const parsed = parseAnalysisFilters(route.query);
  dateRange.value = parsed.dateRange;
  selectedStoreId.value = parsed.storeId;
}

async function syncQuery() {
  await router.replace({
    query: buildAnalysisQuery({
      dateRange: dateRange.value,
      storeId: selectedStoreId.value || undefined
    })
  });
}

async function handleFilterChange() {
  await syncQuery();
}

function handleResize() {
  chartInstance?.resize();
}

watch(
  () => route.query,
  () => {
    applyRouteFilters();
    void loadData();
  },
  { immediate: true }
);

onMounted(() => {
  void loadStores();
  window.addEventListener("resize", handleResize);
});

onUnmounted(() => {
  window.removeEventListener("resize", handleResize);
  chartInstance?.dispose();
  chartInstance = null;
});
</script>

<template>
  <div class="main p-4">
    <el-card class="mb-4">
      <div class="flex items-center justify-between">
        <div class="flex flex-wrap items-center gap-3">
          <el-date-picker
            v-model="dateRange"
            type="daterange"
            range-separator="至"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
            :shortcuts="shortcuts"
            @change="handleFilterChange"
          />
          <el-select
            v-model="selectedStoreId"
            clearable
            filterable
            placeholder="选择门店"
            class="w-[180px]"
            @change="handleFilterChange"
          >
            <el-option
              v-for="item in stores"
              :key="item.uid"
              :label="item.name"
              :value="item.uid"
            />
          </el-select>
        </div>
        <el-button :icon="useRenderIcon(Refresh)" circle @click="loadData" />
      </div>
    </el-card>

    <el-row :gutter="16" class="mb-4">
      <el-col :span="4">
        <el-card shadow="hover" class="text-center">
          <div class="text-gray-500 text-sm">销售总额</div>
          <div class="mt-2 text-xl font-bold text-blue-600">
            ¥{{ formatAmount(summaryData.totalAmount) }}
          </div>
        </el-card>
      </el-col>
      <el-col :span="4">
        <el-card shadow="hover" class="text-center">
          <div class="text-gray-500 text-sm">订单数量</div>
          <div class="mt-2 text-xl font-bold text-slate-900">
            {{ summaryData.totalOrders }}
          </div>
        </el-card>
      </el-col>
      <el-col :span="4">
        <el-card shadow="hover" class="text-center">
          <div class="text-gray-500 text-sm">已收款</div>
          <div class="mt-2 text-xl font-bold text-emerald-600">
            ¥{{ formatAmount(summaryData.paidAmount) }}
          </div>
        </el-card>
      </el-col>
      <el-col :span="4">
        <el-card shadow="hover" class="text-center">
          <div class="text-gray-500 text-sm">未收款</div>
          <div class="mt-2 text-xl font-bold text-orange-600">
            ¥{{ formatAmount(summaryData.unpaidAmount) }}
          </div>
        </el-card>
      </el-col>
      <el-col :span="4">
        <el-card shadow="hover" class="text-center">
          <div class="text-gray-500 text-sm">平均订单金额</div>
          <div class="mt-2 text-xl font-bold text-indigo-600">
            ¥{{ formatAmount(summaryData.averageOrderValue) }}
          </div>
        </el-card>
      </el-col>
      <el-col :span="4">
        <el-card shadow="hover" class="text-center">
          <div class="text-gray-500 text-sm">完成率</div>
          <div class="mt-2 text-xl font-bold text-cyan-600">
            {{ summaryData.completionRate }}%
          </div>
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="16" class="mb-4">
      <el-col :span="16">
        <el-card>
          <template #header>
            <span class="font-bold">销售趋势</span>
          </template>
          <div ref="chartRef" v-loading="loading" class="h-80" />
        </el-card>
      </el-col>
      <el-col :span="8">
        <el-card class="h-full">
          <template #header>
            <span class="font-bold">交付履约概览</span>
          </template>
          <div class="grid grid-cols-2 gap-3">
            <div
              v-for="card in trackingCards"
              :key="card.key"
              class="rounded-xl bg-slate-50 p-4"
            >
              <div class="text-xs text-slate-500">{{ card.label }}</div>
              <div class="mt-2 text-2xl font-semibold text-slate-900">
                {{ card.value }}
              </div>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="16" class="mb-4">
      <el-col :span="12">
        <el-card>
          <template #header>
            <span class="font-bold">销售排行</span>
          </template>
          <el-tabs v-model="activeRankingTab">
            <el-tab-pane label="客户排行" name="customer">
              <pure-table
                stripe
                max-height="320"
                :loading="loading"
                :data="customerRanking"
                :columns="customerColumns"
              />
            </el-tab-pane>
            <el-tab-pane label="商品排行" name="product">
              <pure-table
                stripe
                max-height="320"
                :loading="loading"
                :data="productRanking"
                :columns="productColumns"
              />
            </el-tab-pane>
            <el-tab-pane label="员工排行" name="operator">
              <pure-table
                stripe
                max-height="320"
                :loading="loading"
                :data="operatorRanking"
                :columns="operatorColumns"
              />
            </el-tab-pane>
          </el-tabs>
        </el-card>
      </el-col>
      <el-col :span="12">
        <el-card>
          <template #header>
            <span class="font-bold">待处理销售单</span>
          </template>
          <pure-table
            stripe
            max-height="320"
            :loading="loading"
            :data="exceptionTrackingList"
            :columns="trackingColumns"
          />
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>
