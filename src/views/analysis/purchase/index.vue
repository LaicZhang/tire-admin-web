<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import type { EChartsCoreOption, EChartsType } from "echarts/core";
import {
  getAnalysisMembersApi,
  getProductRankingApi,
  getProviderEvaluationApi,
  getProviderRankingApi,
  getPurchaseOrderTrackingApi,
  getPurchaseSummaryApi,
  getPurchaseTrendApi,
  type AnalysisMember,
  type ProviderEvaluationData,
  type PurchaseOrderTrackingData
} from "@/api/analysis";
import { getStoreListApi, type Store } from "@/api/company/store";
import { useRenderIcon } from "@/components/ReIcon/src/hooks";
import { getEcharts } from "@/utils/echarts";
import { handleApiError } from "@/utils";
import Refresh from "~icons/ep/refresh";
import {
  evaluationColumns,
  productColumns,
  providerColumns,
  trackingColumns
} from "./columns";
import {
  buildAnalysisQuery,
  parseAnalysisFilters,
  toDateParams
} from "../shared";
import { buildTrackingSummaryCards } from "../transformers";
import { useUserStoreHook } from "@/store/modules/user";
import {
  canSelectAnalysisMember,
  getAnalysisSectionOrder,
  resolveAnalysisRoleView
} from "@/utils/analysisRole";

defineOptions({
  name: "AnalysisPurchase"
});

const route = useRoute();
const router = useRouter();
const loading = ref(false);
const stores = ref<Store[]>([]);
const analysisMembers = ref<AnalysisMember[]>([]);
const chartRef = ref<HTMLElement | null>(null);
let chartInstance: EChartsType | null = null;

const dateRange = ref<[Date, Date] | null>(null);
const selectedStoreId = ref("");
const selectedOperatorId = ref("");
const activeRankingTab = ref("provider");

const summaryData = ref({
  totalAmount: "0",
  totalOrders: 0,
  paidAmount: "0",
  unpaidAmount: "0",
  averageOrderValue: "0",
  arrivalRate: 0
});
const trendData = ref<Array<{ period: string; amount: string; count: number }>>(
  []
);
const providerRanking = ref<unknown[]>([]);
const productRanking = ref<unknown[]>([]);
const trackingList = ref<PurchaseOrderTrackingData["list"]>([]);
const trackingSummary = ref<PurchaseOrderTrackingData["summary"]>({
  pending: 0,
  partial: 0,
  completed: 0
});
const providerEvaluationList = ref<ProviderEvaluationData["list"]>([]);
const providerEvaluationSummary = ref<ProviderEvaluationData["summary"]>({
  totalProviders: 0,
  avgCompletionRate: 0,
  avgOnTimeRate: 0
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
  storeId: selectedStoreId.value || undefined,
  operatorId: canSelectMember.value
    ? selectedOperatorId.value || undefined
    : undefined
}));

const trackingCards = computed(() =>
  buildTrackingSummaryCards(trackingSummary.value)
);
const userStore = useUserStoreHook();
const canSelectMember = computed(() =>
  canSelectAnalysisMember(userStore.roles ?? [])
);
const roleView = computed(() => resolveAnalysisRoleView(userStore.roles ?? []));
const visibleSections = computed(
  () => new Set(getAnalysisSectionOrder("purchase", roleView.value))
);
const selectedAnalysisMember = computed(() =>
  analysisMembers.value.find(item => item.uid === selectedOperatorId.value)
);
const currentViewLabel = computed(() => {
  if (!selectedOperatorId.value) return "公司视角";
  return (
    selectedAnalysisMember.value?.nickname ||
    selectedAnalysisMember.value?.name ||
    "成员视角"
  );
});

const exceptionTrackingList = computed(() =>
  trackingList.value.filter(item => item.trackingStatus !== "completed")
);

function formatAmount(val: string | number) {
  return Number(val).toLocaleString("zh-CN", { minimumFractionDigits: 2 });
}

function buildTrendOption(): EChartsCoreOption {
  return {
    tooltip: { trigger: "axis", axisPointer: { type: "shadow" } },
    legend: { data: ["采购金额", "订单数"] },
    grid: { left: "3%", right: "4%", bottom: "3%", containLabel: true },
    xAxis: {
      type: "category",
      data: trendData.value.map(item => item.period)
    },
    yAxis: [
      {
        type: "value",
        name: "金额(元)",
        axisLabel: {
          formatter: (val: number) => (val / 100).toLocaleString()
        }
      },
      {
        type: "value",
        name: "订单数"
      }
    ],
    series: [
      {
        name: "采购金额",
        type: "bar",
        data: trendData.value.map(item => Number(item.amount)),
        itemStyle: { color: "#0f766e" }
      },
      {
        name: "订单数",
        type: "line",
        yAxisIndex: 1,
        smooth: true,
        data: trendData.value.map(item => item.count),
        itemStyle: { color: "#ea580c" }
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
  const { data, code } = await getPurchaseSummaryApi(dateParams.value);
  if (code !== 200 || !data) return;
  summaryData.value = {
    totalAmount: data.totalAmount || "0",
    totalOrders: data.totalOrders || 0,
    paidAmount: data.paidAmount || "0",
    unpaidAmount: data.unpaidAmount || "0",
    averageOrderValue: data.averageOrderValue || "0",
    arrivalRate: data.arrivalRate || 0
  };
}

async function getTrend() {
  const { data, code } = await getPurchaseTrendApi({
    ...dateParams.value,
    groupBy: "month"
  });
  if (code !== 200) return;
  trendData.value = data?.data ?? [];
  await updateChart();
}

async function getRankings() {
  const [providerRes, productRes] = await Promise.all([
    getProviderRankingApi({ ...dateParams.value, limit: 10 }),
    getProductRankingApi({ ...dateParams.value, limit: 10, orderBy: "amount" })
  ]);

  if (providerRes.code === 200) {
    providerRanking.value = providerRes.data?.items ?? [];
  }
  if (productRes.code === 200) {
    productRanking.value = productRes.data?.items ?? [];
  }
}

async function getTracking() {
  const { data, code } = await getPurchaseOrderTrackingApi({
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

async function getProviderEvaluation() {
  const { data, code } = await getProviderEvaluationApi(dateParams.value);
  if (code !== 200 || !data) return;
  providerEvaluationList.value = data.list ?? [];
  providerEvaluationSummary.value = data.summary ?? {
    totalProviders: 0,
    avgCompletionRate: 0,
    avgOnTimeRate: 0
  };
}

async function loadData() {
  loading.value = true;
  try {
    await Promise.all([
      getSummary(),
      getTrend(),
      getRankings(),
      getTracking(),
      getProviderEvaluation()
    ]);
  } catch (error) {
    handleApiError(error, "加载采购分析失败");
  } finally {
    loading.value = false;
  }
}

async function loadStores() {
  const response = await getStoreListApi(1, { pageSize: 100 });
  stores.value = response.data?.list ?? [];
}

async function loadAnalysisMembers() {
  if (!canSelectMember.value) {
    analysisMembers.value = [];
    return;
  }
  const { data, code } = await getAnalysisMembersApi({ module: "purchase" });
  if (code !== 200) return;
  analysisMembers.value = data ?? [];
}

function applyRouteFilters() {
  const parsed = parseAnalysisFilters(route.query);
  dateRange.value = parsed.dateRange;
  selectedStoreId.value = parsed.storeId;
  selectedOperatorId.value = parsed.operatorId;
}

async function syncQuery() {
  await router.replace({
    query: buildAnalysisQuery({
      dateRange: dateRange.value,
      storeId: selectedStoreId.value || undefined,
      extras: {
        operatorId: canSelectMember.value
          ? selectedOperatorId.value || undefined
          : undefined
      }
    })
  });
}

async function handleFilterChange() {
  await syncQuery();
}

async function clearMemberFilter() {
  selectedOperatorId.value = "";
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
  if (roleView.value === "purchase") {
    activeRankingTab.value = "provider";
  }
  void loadStores();
  void loadAnalysisMembers();
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
          <el-tag effect="plain" type="info">
            {{ roleView === "purchase" ? "采购作战视角" : "经营分析视角" }}
          </el-tag>
          <el-tag
            :type="selectedOperatorId ? 'success' : 'info'"
            effect="plain"
          >
            {{ currentViewLabel }}
          </el-tag>
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
          <el-select
            v-if="canSelectMember"
            v-model="selectedOperatorId"
            clearable
            filterable
            placeholder="查看成员图表"
            class="w-[180px]"
            @change="handleFilterChange"
          >
            <el-option
              v-for="item in analysisMembers"
              :key="item.uid"
              :label="item.nickname || item.name || item.uid"
              :value="item.uid"
            />
          </el-select>
          <el-button v-if="selectedOperatorId" text @click="clearMemberFilter">
            返回公司图表
          </el-button>
        </div>
        <el-button :icon="useRenderIcon(Refresh)" circle @click="loadData" />
      </div>
    </el-card>

    <el-row :gutter="16" class="mb-4">
      <el-col :span="4">
        <el-card shadow="hover" class="text-center">
          <div class="text-gray-500 text-sm">采购总额</div>
          <div class="mt-2 text-xl font-bold text-teal-700">
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
          <div class="text-gray-500 text-sm">已付款</div>
          <div class="mt-2 text-xl font-bold text-emerald-600">
            ¥{{ formatAmount(summaryData.paidAmount) }}
          </div>
        </el-card>
      </el-col>
      <el-col :span="4">
        <el-card shadow="hover" class="text-center">
          <div class="text-gray-500 text-sm">未付款</div>
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
          <div class="text-gray-500 text-sm">到货完成率</div>
          <div class="mt-2 text-xl font-bold text-cyan-600">
            {{ summaryData.arrivalRate }}%
          </div>
        </el-card>
      </el-col>
    </el-row>

    <el-row
      v-if="visibleSections.has('trend') || visibleSections.has('tracking')"
      :gutter="16"
      class="mb-4"
    >
      <el-col :span="16">
        <el-card>
          <template #header>
            <span class="font-bold">采购趋势</span>
          </template>
          <div ref="chartRef" v-loading="loading" class="h-80" />
        </el-card>
      </el-col>
      <el-col v-if="visibleSections.has('tracking')" :span="8">
        <el-card class="h-full">
          <template #header>
            <span class="font-bold">到货履约概览</span>
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
          <div
            class="mt-4 rounded-xl border border-dashed border-slate-200 p-4"
          >
            <div class="text-sm text-slate-500">供应商平均表现</div>
            <div class="mt-3 flex items-center justify-between text-sm">
              <span>供应商数</span>
              <strong>{{ providerEvaluationSummary.totalProviders }}</strong>
            </div>
            <div class="mt-2 flex items-center justify-between text-sm">
              <span>平均完成率</span>
              <strong
                >{{ providerEvaluationSummary.avgCompletionRate }}%</strong
              >
            </div>
            <div class="mt-2 flex items-center justify-between text-sm">
              <span>平均准时率</span>
              <strong>{{ providerEvaluationSummary.avgOnTimeRate }}%</strong>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <el-row
      v-if="visibleSections.has('ranking') || visibleSections.has('tracking')"
      :gutter="16"
      class="mb-4"
    >
      <el-col v-if="visibleSections.has('ranking')" :span="12">
        <el-card>
          <template #header>
            <span class="font-bold">采购排行</span>
          </template>
          <el-tabs v-model="activeRankingTab">
            <el-tab-pane label="供应商排行" name="provider">
              <pure-table
                :data="providerRanking"
                :columns="providerColumns"
                stripe
                max-height="360"
              />
            </el-tab-pane>
            <el-tab-pane label="商品排行" name="product">
              <pure-table
                :data="productRanking"
                :columns="productColumns"
                stripe
                max-height="360"
              />
            </el-tab-pane>
          </el-tabs>
        </el-card>
      </el-col>
      <el-col v-if="visibleSections.has('tracking')" :span="12">
        <el-card>
          <template #header>
            <span class="font-bold">待处理采购单</span>
          </template>
          <pure-table
            :data="exceptionTrackingList"
            :columns="trackingColumns"
            stripe
            max-height="360"
          />
        </el-card>
      </el-col>
    </el-row>

    <el-card v-if="visibleSections.has('evaluation')">
      <template #header>
        <span class="font-bold">供应商履约评估</span>
      </template>
      <pure-table
        :data="providerEvaluationList"
        :columns="evaluationColumns"
        stripe
        max-height="360"
      />
    </el-card>
  </div>
</template>
