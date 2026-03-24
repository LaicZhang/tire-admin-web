<script setup lang="ts">
import {
  computed,
  nextTick,
  onMounted,
  onUnmounted,
  reactive,
  ref,
  watch
} from "vue";
import { useRoute, useRouter } from "vue-router";
import type { EChartsCoreOption, EChartsType } from "echarts/core";
import dayjs from "dayjs";
import {
  getDashboardOverviewApi,
  type DashboardOverviewData,
  type DashboardRankingItem,
  type DashboardTrendItem
} from "@/api/dashboard";
import { getStoreListApi, type Store } from "@/api/company/store";
import { getRepoListApi, type Repo } from "@/api/company/repo";
import { getEcharts } from "@/utils/echarts";
import { handleApiError } from "@/utils";
import {
  buildAnalysisQuery,
  parseAnalysisFilters,
  toDateParams
} from "../shared";

defineOptions({
  name: "AnalysisDashboard"
});

const route = useRoute();
const router = useRouter();
const loading = ref(false);

const filters = reactive({
  dateRange: null as [Date, Date] | null,
  storeId: "",
  repoId: ""
});

const shortcuts = [
  {
    text: "最近一周",
    value: () => {
      const end = new Date();
      const start = new Date();
      start.setDate(start.getDate() - 6);
      return [start, end];
    }
  },
  {
    text: "最近一个月",
    value: () => {
      const end = new Date();
      const start = new Date();
      start.setDate(start.getDate() - 29);
      return [start, end];
    }
  },
  {
    text: "最近三个月",
    value: () => {
      const end = new Date();
      const start = new Date();
      start.setDate(start.getDate() - 89);
      return [start, end];
    }
  }
];

const stores = ref<Store[]>([]);
const repos = ref<Repo[]>([]);
const dashboardData = ref<DashboardOverviewData | null>(null);

const storeChartRef = ref<HTMLElement | null>(null);
const warehouseChartRef = ref<HTMLElement | null>(null);
const purchaseChartRef = ref<HTMLElement | null>(null);
const salesChartRef = ref<HTMLElement | null>(null);

let storeChart: EChartsType | null = null;
let warehouseChart: EChartsType | null = null;
let purchaseChart: EChartsType | null = null;
let salesChart: EChartsType | null = null;

const currentStore = computed(() =>
  stores.value.find(item => item.uid === filters.storeId)
);

const repoOptions = computed(() => {
  const defaultRepoId = currentStore.value?.defaultRepositoryId;
  if (!defaultRepoId) return repos.value;
  return repos.value.filter(item => item.uid === defaultRepoId);
});

const filterParams = computed(() => ({
  ...toDateParams(filters.dateRange),
  storeId: filters.storeId || undefined,
  repoId: filters.repoId || undefined
}));

function formatAmount(value?: string | number) {
  const num = Number(value ?? 0);
  return num.toLocaleString("zh-CN", { minimumFractionDigits: 2 });
}

function applyRouteFilters() {
  const parsed = parseAnalysisFilters(route.query);
  filters.dateRange = parsed.dateRange;
  filters.storeId = parsed.storeId;
  filters.repoId = parsed.repoId;
}

async function syncRouteQuery() {
  await router.replace({
    query: buildAnalysisQuery({
      dateRange: filters.dateRange,
      storeId: filters.storeId || undefined,
      repoId: filters.repoId || undefined
    })
  });
}

async function loadOptions() {
  const [storeRes, repoRes] = await Promise.all([
    getStoreListApi(1, { pageSize: 100 }),
    getRepoListApi(1, { pageSize: 100 })
  ]);
  stores.value = storeRes.data?.list ?? [];
  repos.value = repoRes.data?.list ?? [];
}

async function loadDashboard() {
  loading.value = true;
  try {
    const { data, code } = await getDashboardOverviewApi(filterParams.value);
    if (code === 200 && data) {
      dashboardData.value = data;
      await nextTick();
      await renderAllCharts();
    }
  } catch (error) {
    handleApiError(error, "加载经营驾驶舱失败");
  } finally {
    loading.value = false;
  }
}

function buildQueryForTarget(extra?: Record<string, string | undefined>) {
  return buildAnalysisQuery({
    dateRange: filters.dateRange,
    storeId: filters.storeId || undefined,
    repoId: filters.repoId || undefined,
    extras: extra
  });
}

function gotoPage(path: string, extra?: Record<string, string | undefined>) {
  router.push({ path, query: buildQueryForTarget(extra) });
}

function handleStoreChange() {
  const defaultRepoId = currentStore.value?.defaultRepositoryId ?? "";
  if (filters.storeId && defaultRepoId) {
    filters.repoId = defaultRepoId;
  } else if (filters.storeId && !defaultRepoId) {
    filters.repoId = "";
  }
  void refreshDashboard();
}

function handleRepoChange() {
  void refreshDashboard();
}

async function refreshDashboard() {
  await syncRouteQuery();
  await loadDashboard();
}

async function ensureChart(
  instance: EChartsType | null,
  el: HTMLElement | null
) {
  if (!el) return null;
  if (instance) return instance;
  const echarts = await getEcharts();
  return echarts.init(el);
}

function buildTrendOption(
  title: string,
  trend: DashboardTrendItem[]
): EChartsCoreOption {
  const hasAmount = trend.some(item => item.amount !== undefined);
  return {
    title: { text: title, textStyle: { fontSize: 14, fontWeight: 500 } },
    tooltip: { trigger: "axis" },
    grid: { left: 40, right: 20, top: 48, bottom: 24 },
    xAxis: {
      type: "category",
      data: trend.map(item => item.label)
    },
    yAxis: hasAmount
      ? [
          {
            type: "value",
            axisLabel: {
              formatter: (val: number) => `${(val / 100).toFixed(0)}`
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
            data: trend.map(item => Number(item.amount ?? 0)),
            itemStyle: { color: "#2563eb" }
          },
          {
            name: "数量",
            type: "line",
            yAxisIndex: 1,
            smooth: true,
            data: trend.map(item => item.count ?? 0),
            itemStyle: { color: "#16a34a" }
          }
        ]
      : [
          {
            name: "数值",
            type: "line",
            smooth: true,
            data: trend.map(item => item.value ?? 0),
            itemStyle: { color: "#ea580c" },
            areaStyle: { color: "rgba(234, 88, 12, 0.18)" }
          }
        ]
  };
}

async function renderAllCharts() {
  const data = dashboardData.value;
  if (!data) return;

  storeChart = await ensureChart(storeChart, storeChartRef.value);
  warehouseChart = await ensureChart(warehouseChart, warehouseChartRef.value);
  purchaseChart = await ensureChart(purchaseChart, purchaseChartRef.value);
  salesChart = await ensureChart(salesChart, salesChartRef.value);

  storeChart?.setOption(
    buildTrendOption("门店经营趋势", data.storeMetrics.trend)
  );
  warehouseChart?.setOption(
    buildTrendOption("仓库运营趋势", data.warehouseMetrics.trend)
  );
  purchaseChart?.setOption(
    buildTrendOption("采购趋势", data.purchaseMetrics.trend)
  );
  salesChart?.setOption(buildTrendOption("销售趋势", data.salesMetrics.trend));

  storeChart?.off("click");
  warehouseChart?.off("click");
  purchaseChart?.off("click");
  salesChart?.off("click");

  storeChart?.on("click", params => {
    gotoPage("/analysis/sales", { period: String(params.name) });
  });
  warehouseChart?.on("click", params => {
    gotoPage("/analysis/inventory", { period: String(params.name) });
  });
  purchaseChart?.on("click", params => {
    gotoPage("/analysis/purchase", { period: String(params.name) });
  });
  salesChart?.on("click", params => {
    gotoPage("/analysis/sales", { period: String(params.name) });
  });
}

function handleResize() {
  storeChart?.resize();
  warehouseChart?.resize();
  purchaseChart?.resize();
  salesChart?.resize();
}

function handleRankingClick(
  type: "store" | "warehouse" | "purchase" | "sales",
  row: DashboardRankingItem
) {
  if (type === "store") {
    gotoPage("/analysis/sales", { storeId: row.id });
    return;
  }
  if (type === "warehouse") {
    gotoPage("/analysis/inventory", { repoId: row.id });
    return;
  }
  if (type === "purchase") {
    gotoPage("/analysis/purchase");
    return;
  }
  gotoPage("/analysis/sales");
}

watch(
  () => route.query,
  () => {
    applyRouteFilters();
  }
);

onMounted(async () => {
  applyRouteFilters();
  if (!filters.dateRange) {
    filters.dateRange = [
      dayjs().subtract(29, "day").toDate(),
      dayjs().toDate()
    ];
  }
  await loadOptions();
  if (filters.storeId && !filters.repoId) {
    filters.repoId = currentStore.value?.defaultRepositoryId ?? "";
  }
  await syncRouteQuery();
  await loadDashboard();
  window.addEventListener("resize", handleResize);
});

onUnmounted(() => {
  window.removeEventListener("resize", handleResize);
  storeChart?.dispose();
  warehouseChart?.dispose();
  purchaseChart?.dispose();
  salesChart?.dispose();
});
</script>

<template>
  <div class="main p-4">
    <el-card class="mb-4">
      <div class="flex flex-wrap items-center gap-3">
        <el-date-picker
          v-model="filters.dateRange"
          type="daterange"
          range-separator="至"
          start-placeholder="开始日期"
          end-placeholder="结束日期"
          :shortcuts="shortcuts"
          @change="refreshDashboard"
        />
        <el-select
          v-model="filters.storeId"
          clearable
          filterable
          placeholder="选择门店"
          class="w-[180px]"
          @change="handleStoreChange"
        >
          <el-option
            v-for="item in stores"
            :key="item.uid"
            :label="item.name"
            :value="item.uid"
          />
        </el-select>
        <el-select
          v-model="filters.repoId"
          clearable
          filterable
          placeholder="选择仓库"
          class="w-[180px]"
          @change="handleRepoChange"
        >
          <el-option
            v-for="item in repoOptions"
            :key="item.uid"
            :label="item.name"
            :value="item.uid"
          />
        </el-select>
      </div>
    </el-card>

    <el-row :gutter="16" class="mb-4">
      <el-col :span="6">
        <el-card v-loading="loading" shadow="hover">
          <div class="text-sm text-gray-500">门店销售额</div>
          <div class="mt-3 text-2xl font-bold text-slate-900">
            ¥{{ formatAmount(dashboardData?.storeMetrics.summary.salesAmount) }}
          </div>
          <div class="mt-2 text-xs text-gray-500">
            完成率
            {{ dashboardData?.storeMetrics.summary.completionRate ?? 0 }}%
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card v-loading="loading" shadow="hover">
          <div class="text-sm text-gray-500">仓库库存价值</div>
          <div class="mt-3 text-2xl font-bold text-slate-900">
            ¥{{
              formatAmount(dashboardData?.warehouseMetrics.summary.totalValue)
            }}
          </div>
          <div class="mt-2 text-xs text-gray-500">
            预警
            {{ dashboardData?.warehouseMetrics.summary.belowAlarmCount ?? 0 }}
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card v-loading="loading" shadow="hover">
          <div class="text-sm text-gray-500">采购总额</div>
          <div class="mt-3 text-2xl font-bold text-slate-900">
            ¥{{
              formatAmount(dashboardData?.purchaseMetrics.summary.totalAmount)
            }}
          </div>
          <div class="mt-2 text-xs text-gray-500">
            到货率
            {{ dashboardData?.purchaseMetrics.summary.arrivalRate ?? 0 }}%
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card v-loading="loading" shadow="hover">
          <div class="text-sm text-gray-500">销售总额</div>
          <div class="mt-3 text-2xl font-bold text-slate-900">
            ¥{{ formatAmount(dashboardData?.salesMetrics.summary.totalAmount) }}
          </div>
          <div class="mt-2 text-xs text-gray-500">
            订单 {{ dashboardData?.salesMetrics.summary.totalOrders ?? 0 }}
          </div>
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="16">
      <el-col :span="12" class="mb-4">
        <el-card v-loading="loading">
          <template #header>
            <div class="flex items-center justify-between">
              <span class="font-bold">门店经营</span>
              <el-button
                link
                type="primary"
                @click="gotoPage('/analysis/sales')"
              >
                查看销售分析
              </el-button>
            </div>
          </template>
          <div ref="storeChartRef" class="h-72" />
          <div class="mt-4">
            <div class="mb-2 text-sm font-medium">门店排行</div>
            <el-table
              :data="dashboardData?.storeMetrics.ranking ?? []"
              size="small"
              @row-click="row => handleRankingClick('store', row)"
            >
              <el-table-column prop="rank" label="#" width="60" />
              <el-table-column prop="name" label="门店" />
              <el-table-column label="销售额" min-width="140">
                <template #default="{ row }">
                  ¥{{ formatAmount(row.amount) }}
                </template>
              </el-table-column>
            </el-table>
          </div>
        </el-card>
      </el-col>

      <el-col :span="12" class="mb-4">
        <el-card v-loading="loading">
          <template #header>
            <div class="flex items-center justify-between">
              <span class="font-bold">仓库运营</span>
              <el-button
                link
                type="primary"
                @click="gotoPage('/analysis/inventory')"
              >
                查看库存分析
              </el-button>
            </div>
          </template>
          <div ref="warehouseChartRef" class="h-72" />
          <div class="mt-4">
            <div class="mb-2 text-sm font-medium">仓库排行</div>
            <el-table
              :data="dashboardData?.warehouseMetrics.ranking ?? []"
              size="small"
              @row-click="row => handleRankingClick('warehouse', row)"
            >
              <el-table-column prop="rank" label="#" width="60" />
              <el-table-column prop="name" label="仓库" />
              <el-table-column label="库存价值" min-width="140">
                <template #default="{ row }">
                  ¥{{ formatAmount(row.amount) }}
                </template>
              </el-table-column>
            </el-table>
          </div>
        </el-card>
      </el-col>

      <el-col :span="12" class="mb-4">
        <el-card v-loading="loading">
          <template #header>
            <div class="flex items-center justify-between">
              <span class="font-bold">采购表现</span>
              <el-button
                link
                type="primary"
                @click="gotoPage('/analysis/purchase')"
              >
                查看采购分析
              </el-button>
            </div>
          </template>
          <div ref="purchaseChartRef" class="h-72" />
          <div class="mt-4">
            <div class="mb-2 text-sm font-medium">供应商排行</div>
            <el-table
              :data="dashboardData?.purchaseMetrics.ranking ?? []"
              size="small"
              @row-click="row => handleRankingClick('purchase', row)"
            >
              <el-table-column prop="rank" label="#" width="60" />
              <el-table-column prop="name" label="供应商" />
              <el-table-column label="采购额" min-width="140">
                <template #default="{ row }">
                  ¥{{ formatAmount(row.amount) }}
                </template>
              </el-table-column>
            </el-table>
          </div>
        </el-card>
      </el-col>

      <el-col :span="12" class="mb-4">
        <el-card v-loading="loading">
          <template #header>
            <div class="flex items-center justify-between">
              <span class="font-bold">销售表现</span>
              <el-button
                link
                type="primary"
                @click="gotoPage('/analysis/sales')"
              >
                查看销售分析
              </el-button>
            </div>
          </template>
          <div ref="salesChartRef" class="h-72" />
          <div class="mt-4">
            <div class="mb-2 text-sm font-medium">客户排行</div>
            <el-table
              :data="dashboardData?.salesMetrics.ranking ?? []"
              size="small"
              @row-click="row => handleRankingClick('sales', row)"
            >
              <el-table-column prop="rank" label="#" width="60" />
              <el-table-column prop="name" label="客户" />
              <el-table-column label="销售额" min-width="140">
                <template #default="{ row }">
                  ¥{{ formatAmount(row.amount) }}
                </template>
              </el-table-column>
            </el-table>
          </div>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>
