<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import type { EChartsType } from "echarts/core";
import {
  getAnalysisMembersApi,
  getDotAgingApi,
  getExpiryDistributionApi,
  getInventoryMovementApi,
  getInventorySummaryApi,
  getInventoryTurnoverApi,
  getSlowMovingApi,
  getStockoutApi,
  type AnalysisMember
} from "@/api/analysis";
import { getRepoListApi, type Repo } from "@/api/company/repo";
import { getStoreListApi, type Store } from "@/api/company/store";
import { getEcharts } from "@/utils/echarts";
import { handleApiError } from "@/utils";
import { movementColumns, slowMovingColumns, stockoutColumns } from "./columns";
import { formatYuanAmount } from "../transformers";
import AnalysisDateToolbar from "../components/AnalysisDateToolbar.vue";
import {
  buildAnalysisFilterQuery,
  createDefaultAnalysisFilterState,
  inferGroupBy,
  parseAnalysisFilters,
  toRequiredDateParams,
  type AnalysisGroupBy
} from "../shared";
import { buildInventoryMovementRows } from "../transformers";
import { useUserStoreHook } from "@/store/modules/user";
import {
  canSelectAnalysisMember,
  getAnalysisSectionOrder,
  resolveAnalysisRoleView
} from "@/utils/analysisRole";

defineOptions({
  name: "AnalysisInventory"
});

const route = useRoute();
const router = useRouter();
const loading = ref(false);
const stores = ref<Store[]>([]);
const repos = ref<Repo[]>([]);
const analysisMembers = ref<AnalysisMember[]>([]);

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
const selectedStoreId = ref("");
const selectedRepoId = ref("");
const selectedOperatorId = ref("");

const summaryData = ref({
  totalCount: 0,
  toBeStockedCount: 0,
  toBeShippedCount: 0,
  inTransitCount: 0,
  totalValue: "0",
  skuCount: 0,
  repoCount: 0,
  belowAlarmCount: 0
});
const slowMovingList = ref<
  Array<{
    tireName?: string;
    repoName?: string;
    quantity?: number;
    lastMoveDate?: string;
  }>
>([]);
const stockoutList = ref<
  Array<{
    tireName?: string;
    currentQuantity?: number;
    safetyStock?: number;
    suggestPurchase?: number;
  }>
>([]);
const turnoverData = ref({
  turnoverRate: 0,
  averageDays: 0,
  details: [] as Array<{
    repoName?: string;
    name?: string;
    turnoverRate?: number;
  }>
});
const expiryData = ref<
  Array<{ label?: string; bucket?: string; count?: number; quantity?: number }>
>([]);
const dotAgingList = ref<
  Array<{
    repoName?: string;
    tireName?: string;
    dotYear?: number;
    dotWeek?: number;
    count?: number;
  }>
>([]);
const movementRows = ref<
  Array<{
    key: "begin" | "in" | "out" | "end";
    label: string;
    quantity: number;
    amount: number;
  }>
>([]);

const turnoverChartRef = ref<HTMLElement | null>(null);
const expiryChartRef = ref<HTMLElement | null>(null);
const movementChartRef = ref<HTMLElement | null>(null);
const slowMovingChartRef = ref<HTMLElement | null>(null);
const stockoutChartRef = ref<HTMLElement | null>(null);
const dotAgingChartRef = ref<HTMLElement | null>(null);
let turnoverChart: EChartsType | null = null;
let expiryChart: EChartsType | null = null;
let movementChart: EChartsType | null = null;
let slowMovingChart: EChartsType | null = null;
let stockoutChart: EChartsType | null = null;
let dotAgingChart: EChartsType | null = null;

const currentStore = computed(() =>
  stores.value.find(item => item.uid === selectedStoreId.value)
);

const repoOptions = computed(() => {
  const defaultRepoId = currentStore.value?.defaultRepositoryId;
  if (!defaultRepoId) return repos.value;
  return repos.value.filter(item => item.uid === defaultRepoId);
});
const userStore = useUserStoreHook();
const canSelectMember = computed(() =>
  canSelectAnalysisMember(userStore.roles ?? [])
);
const roleView = computed(() => resolveAnalysisRoleView(userStore.roles ?? []));
const visibleSections = computed(
  () => new Set(getAnalysisSectionOrder("inventory", roleView.value))
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
const inventoryParams = computed(() => ({
  ...toRequiredDateParams(dateRange.value),
  repoId: selectedRepoId.value || undefined,
  operatorId: canSelectMember.value
    ? selectedOperatorId.value || undefined
    : undefined
}));

async function getSummary() {
  const { data, code } = await getInventorySummaryApi(inventoryParams.value);
  if (code !== 200 || !data) return;
  summaryData.value = {
    totalCount: data.totalCount || 0,
    toBeStockedCount: data.toBeStockedCount || 0,
    toBeShippedCount: data.toBeShippedCount || 0,
    inTransitCount: data.inTransitCount || 0,
    totalValue: data.totalValue || "0",
    skuCount: data.skuCount || 0,
    repoCount: data.repoCount || 0,
    belowAlarmCount: data.belowAlarmCount || 0
  };
}

async function getSlowMoving() {
  const { data, code } = await getSlowMovingApi({
    days: 90,
    ...inventoryParams.value
  });
  if (code !== 200) return;
  slowMovingList.value = (Array.isArray(data) ? data : data?.items) || [];
  await updateSlowMovingChart();
}

async function getStockout() {
  const { data, code } = await getStockoutApi(inventoryParams.value);
  if (code !== 200) return;
  stockoutList.value = (Array.isArray(data) ? data : data?.items) || [];
  await updateStockoutChart();
}

async function getTurnover() {
  const { data, code } = await getInventoryTurnoverApi(inventoryParams.value);
  if (code !== 200 || !data) return;
  turnoverData.value = {
    turnoverRate: data.turnoverRate || 0,
    averageDays: data.averageDays || 0,
    details: data.details || []
  };
  await updateTurnoverChart();
}

async function getExpiry() {
  const { data, code } = await getExpiryDistributionApi(inventoryParams.value);
  if (code !== 200) return;
  expiryData.value = (Array.isArray(data) ? data : data?.buckets) || [];
  await updateExpiryChart();
}

async function getDotAging() {
  const { data, code } = await getDotAgingApi(inventoryParams.value);
  if (code !== 200) return;
  dotAgingList.value = data?.list || [];
  await updateDotAgingChart();
}

async function getMovement() {
  const { data, code } = await getInventoryMovementApi({
    ...inventoryParams.value,
    tireId: undefined,
    startDate: undefined,
    endDate: undefined
  });
  if (code !== 200 || !data) return;
  movementRows.value = buildInventoryMovementRows(data);
  await updateMovementChart();
}

async function ensureChart(
  chart: EChartsType | null,
  element: HTMLElement | null
) {
  if (!element) return null;
  if (chart) return chart;
  const echarts = await getEcharts();
  return echarts.init(element);
}

async function updateTurnoverChart() {
  turnoverChart = await ensureChart(turnoverChart, turnoverChartRef.value);
  if (!turnoverChart) return;
  turnoverChart.setOption({
    tooltip: { trigger: "axis" },
    xAxis: {
      type: "category",
      data: turnoverData.value.details.map(
        detail => detail.repoName || detail.name
      )
    },
    yAxis: { type: "value", name: "周转次数" },
    series: [
      {
        type: "bar",
        data: turnoverData.value.details.map(
          detail => detail.turnoverRate || 0
        ),
        itemStyle: { color: "#2563eb" }
      }
    ]
  });
}

async function updateExpiryChart() {
  expiryChart = await ensureChart(expiryChart, expiryChartRef.value);
  if (!expiryChart) return;
  expiryChart.setOption({
    tooltip: { trigger: "item" },
    series: [
      {
        type: "pie",
        radius: "60%",
        data: expiryData.value.map(item => ({
          name: item.label || item.bucket,
          value: item.count || item.quantity
        }))
      }
    ]
  });
}

async function updateMovementChart() {
  movementChart = await ensureChart(movementChart, movementChartRef.value);
  if (!movementChart) return;
  movementChart.setOption({
    tooltip: { trigger: "axis" },
    legend: { data: ["数量", "金额"] },
    xAxis: {
      type: "category",
      data: movementRows.value.map(item => item.label)
    },
    yAxis: [
      { type: "value", name: "数量" },
      { type: "value", name: "金额" }
    ],
    series: [
      {
        name: "数量",
        type: "bar",
        data: movementRows.value.map(item => item.quantity),
        itemStyle: { color: "#0f766e" }
      },
      {
        name: "金额",
        type: "line",
        yAxisIndex: 1,
        smooth: true,
        data: movementRows.value.map(item => item.amount),
        itemStyle: { color: "#f97316" }
      }
    ]
  });
}

async function updateSlowMovingChart() {
  slowMovingChart = await ensureChart(
    slowMovingChart,
    slowMovingChartRef.value
  );
  if (!slowMovingChart) return;
  const rows = slowMovingList.value
    .map(item => ({
      name: item.tireName || "未知",
      qty: Number(
        item.quantity ?? (item as { stockQuantity?: number }).stockQuantity ?? 0
      )
    }))
    .sort((a, b) => b.qty - a.qty)
    .slice(0, 12);
  slowMovingChart.setOption({
    tooltip: { trigger: "axis", axisPointer: { type: "shadow" } },
    grid: {
      left: "3%",
      right: "8%",
      top: "8%",
      bottom: "3%",
      containLabel: true
    },
    xAxis: { type: "value", name: "数量" },
    yAxis: {
      type: "category",
      data: rows.map(r => r.name).reverse(),
      axisLabel: { width: 100, overflow: "truncate" }
    },
    series: [
      {
        name: "滞销库存",
        type: "bar",
        data: rows.map(r => r.qty).reverse(),
        itemStyle: { color: "#f59e0b" }
      }
    ]
  });
}

async function updateStockoutChart() {
  stockoutChart = await ensureChart(stockoutChart, stockoutChartRef.value);
  if (!stockoutChart) return;
  const rows = stockoutList.value
    .map(item => {
      const current = Number(
        item.currentQuantity ??
          (item as { currentStock?: number }).currentStock ??
          0
      );
      const safety = Number(
        item.safetyStock ?? (item as { minStock?: number }).minStock ?? 0
      );
      const gap = Math.max(0, Number(item.suggestPurchase ?? safety - current));
      return {
        name: item.tireName || (item as { name?: string }).name || "未知",
        gap
      };
    })
    .sort((a, b) => b.gap - a.gap)
    .slice(0, 12);
  stockoutChart.setOption({
    tooltip: { trigger: "axis", axisPointer: { type: "shadow" } },
    grid: {
      left: "3%",
      right: "8%",
      top: "8%",
      bottom: "3%",
      containLabel: true
    },
    xAxis: { type: "value", name: "缺口" },
    yAxis: {
      type: "category",
      data: rows.map(r => r.name).reverse(),
      axisLabel: { width: 100, overflow: "truncate" }
    },
    series: [
      {
        name: "缺货缺口",
        type: "bar",
        data: rows.map(r => r.gap).reverse(),
        itemStyle: { color: "#ef4444" }
      }
    ]
  });
}

async function updateDotAgingChart() {
  dotAgingChart = await ensureChart(dotAgingChart, dotAgingChartRef.value);
  if (!dotAgingChart) return;
  // stack counts by repo × DOT year buckets
  const repos = Array.from(
    new Set(dotAgingList.value.map(i => i.repoName || "未分配仓"))
  );
  const years = Array.from(
    new Set(dotAgingList.value.map(i => String(i.dotYear ?? "未知")))
  ).sort();
  const series = years.map((year, idx) => ({
    name: `DOT ${year}`,
    type: "bar" as const,
    stack: "dot",
    emphasis: { focus: "series" as const },
    data: repos.map(repo =>
      dotAgingList.value
        .filter(
          i =>
            (i.repoName || "未分配仓") === repo &&
            String(i.dotYear ?? "未知") === year
        )
        .reduce((sum, i) => sum + Number(i.count ?? 0), 0)
    ),
    itemStyle: {
      color: ["#22c55e", "#3b82f6", "#eab308", "#f97316", "#ef4444", "#7c3aed"][
        idx % 6
      ]
    }
  }));
  dotAgingChart.setOption(
    {
      tooltip: { trigger: "axis", axisPointer: { type: "shadow" } },
      legend: { bottom: 0 },
      grid: {
        left: "3%",
        right: "4%",
        top: "8%",
        bottom: "16%",
        containLabel: true
      },
      xAxis: {
        type: "category",
        data: repos,
        axisLabel: { rotate: repos.length > 4 ? 30 : 0 }
      },
      yAxis: { type: "value", name: "数量" },
      series
    },
    true
  );
}

async function loadData() {
  loading.value = true;
  try {
    await Promise.all([
      getSummary(),
      getSlowMoving(),
      getStockout(),
      getTurnover(),
      getExpiry(),
      getDotAging(),
      getMovement()
    ]);
  } catch (error) {
    handleApiError(error, "加载库存分析失败");
  } finally {
    loading.value = false;
  }
}

async function loadOptions() {
  const [storeRes, repoRes] = await Promise.all([
    getStoreListApi(1, { pageSize: 100 }),
    getRepoListApi(1, { pageSize: 100 })
  ]);
  stores.value = storeRes.data?.list ?? [];
  repos.value = repoRes.data?.list ?? [];
}

async function loadAnalysisMembers() {
  if (!canSelectMember.value) {
    analysisMembers.value = [];
    return;
  }
  const { data, code } = await getAnalysisMembersApi({ module: "inventory" });
  if (code !== 200) return;
  analysisMembers.value = data ?? [];
}

function applyRouteFilters() {
  const parsed = parseAnalysisFilters(route.query);
  filterState.value = { ...parsed };
  selectedStoreId.value = parsed.storeId;
  selectedRepoId.value = parsed.repoId;
  selectedOperatorId.value = parsed.operatorId;
}

async function syncQuery() {
  await router.replace({
    query: buildAnalysisFilterQuery({
      ...filterState.value,
      storeId: selectedStoreId.value,
      repoId: selectedRepoId.value,
      operatorId: canSelectMember.value ? selectedOperatorId.value : ""
    })
  });
}

async function handleFiltersChange() {
  const defaultRepoId = currentStore.value?.defaultRepositoryId ?? "";
  if (selectedStoreId.value && defaultRepoId) {
    selectedRepoId.value = defaultRepoId;
  }
  await syncQuery();
}

async function clearMemberFilter() {
  selectedOperatorId.value = "";
  await syncQuery();
}

function handleResize() {
  turnoverChart?.resize();
  expiryChart?.resize();
  movementChart?.resize();
  slowMovingChart?.resize();
  stockoutChart?.resize();
  dotAgingChart?.resize();
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
  void loadOptions();
  void loadAnalysisMembers();
  window.addEventListener("resize", handleResize);
});

onUnmounted(() => {
  window.removeEventListener("resize", handleResize);
  turnoverChart?.dispose();
  expiryChart?.dispose();
  movementChart?.dispose();
  slowMovingChart?.dispose();
  stockoutChart?.dispose();
  dotAgingChart?.dispose();
  turnoverChart = null;
  expiryChart = null;
  movementChart = null;
  slowMovingChart = null;
  stockoutChart = null;
  dotAgingChart = null;
});
</script>

<template>
  <div class="main p-4">
    <el-card class="mb-4">
      <div class="flex items-center justify-between">
        <div class="flex flex-wrap items-center gap-3">
          <span class="text-lg font-bold">库存数据总览</span>
          <el-tag effect="plain" type="info">
            {{ roleView === "warehouse" ? "库存作战视角" : "经营分析视角" }}
          </el-tag>
          <el-tag
            :type="selectedOperatorId ? 'success' : 'info'"
            effect="plain"
          >
            {{ currentViewLabel }}
          </el-tag>
          <AnalysisDateToolbar
            v-model:date-range="dateRange"
            v-model:group-by="groupBy"
            :show-group-by="false"
            :loading="loading"
            @change="handleFiltersChange"
            @refresh="loadData"
          />
          <el-select
            v-model="selectedStoreId"
            clearable
            filterable
            placeholder="选择门店"
            class="w-[180px]"
            @change="handleFiltersChange"
          >
            <el-option
              v-for="item in stores"
              :key="item.uid"
              :label="item.name"
              :value="item.uid"
            />
          </el-select>
          <el-select
            v-model="selectedRepoId"
            clearable
            filterable
            placeholder="选择仓库"
            class="w-[180px]"
            @change="handleFiltersChange"
          >
            <el-option
              v-for="item in repoOptions"
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
            @change="handleFiltersChange"
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
      </div>
    </el-card>

    <el-row :gutter="16" class="mb-4">
      <el-col :span="6">
        <el-card shadow="hover" class="text-center">
          <div class="text-gray-500 text-sm">库存总价值</div>
          <div class="mt-2 text-xl font-bold text-blue-600">
            ¥{{ formatYuanAmount(summaryData.totalValue) }}
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover" class="text-center">
          <div class="text-gray-500 text-sm">库存商品总数</div>
          <div class="mt-2 text-xl font-bold text-slate-900">
            {{ summaryData.totalCount }}
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover" class="text-center">
          <div class="text-gray-500 text-sm">待入库 / 待发货</div>
          <div class="mt-2 text-xl font-bold text-orange-600">
            {{ summaryData.toBeStockedCount }} /
            {{ summaryData.toBeShippedCount }}
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover" class="text-center">
          <div class="text-gray-500 text-sm">库存预警商品数</div>
          <div class="mt-2 text-xl font-bold text-red-600">
            {{ summaryData.belowAlarmCount }}
          </div>
        </el-card>
      </el-col>
    </el-row>

    <el-row
      v-if="visibleSections.has('turnover') || visibleSections.has('movement')"
      :gutter="16"
      class="mb-4"
    >
      <el-col v-if="visibleSections.has('turnover')" :span="12">
        <el-card>
          <template #header>
            <div class="flex items-center justify-between">
              <span class="font-bold">库存周转率</span>
              <el-tag type="info" size="small">
                平均周转天数: {{ turnoverData.averageDays }} 天
              </el-tag>
            </div>
          </template>
          <div ref="turnoverChartRef" v-loading="loading" class="h-72" />
        </el-card>
      </el-col>
      <el-col v-if="visibleSections.has('movement')" :span="12">
        <el-card>
          <template #header>
            <span class="font-bold">进销存汇总</span>
          </template>
          <div ref="movementChartRef" v-loading="loading" class="h-72" />
          <div class="mt-4">
            <pure-table
              :data="movementRows"
              :columns="movementColumns"
              stripe
              max-height="220"
            />
          </div>
        </el-card>
      </el-col>
    </el-row>

    <el-row
      v-if="
        visibleSections.has('slowMoving') || visibleSections.has('stockout')
      "
      :gutter="16"
      class="mb-4"
    >
      <el-col v-if="visibleSections.has('slowMoving')" :span="12">
        <el-card>
          <template #header>
            <span class="font-bold">滞销商品（B7 bar）</span>
          </template>
          <div ref="slowMovingChartRef" v-loading="loading" class="h-64 mb-3" />
          <pure-table
            :data="slowMovingList"
            :columns="slowMovingColumns"
            stripe
            height="240"
          />
        </el-card>
      </el-col>
      <el-col v-if="visibleSections.has('stockout')" :span="12">
        <el-card>
          <template #header>
            <span class="font-bold">缺货预警（B8 gap bar）</span>
          </template>
          <div ref="stockoutChartRef" v-loading="loading" class="h-64 mb-3" />
          <pure-table
            :data="stockoutList"
            :columns="stockoutColumns"
            stripe
            height="240"
          />
        </el-card>
      </el-col>
    </el-row>

    <el-row
      v-if="visibleSections.has('expiry') || visibleSections.has('dotAging')"
      :gutter="16"
      class="mb-4"
    >
      <el-col v-if="visibleSections.has('expiry')" :span="12">
        <el-card>
          <template #header>
            <span class="font-bold">临期分布</span>
          </template>
          <div ref="expiryChartRef" v-loading="loading" class="h-72" />
        </el-card>
      </el-col>
      <el-col v-if="visibleSections.has('dotAging')" :span="12">
        <el-card>
          <template #header>
            <span class="font-bold">DOT 库龄分布（B6 stacked）</span>
          </template>
          <div ref="dotAgingChartRef" v-loading="loading" class="h-64 mb-3" />
          <pure-table
            :data="dotAgingList"
            stripe
            height="220"
            :columns="[
              { label: '仓库', prop: 'repoName', minWidth: 120 },
              { label: '轮胎', prop: 'tireName', minWidth: 180 },
              { label: 'DOT 年', prop: 'dotYear', width: 100 },
              { label: 'DOT 周', prop: 'dotWeek', width: 100 },
              { label: '数量', prop: 'count', width: 100 }
            ]"
          />
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>
