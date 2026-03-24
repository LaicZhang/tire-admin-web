<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import type { EChartsType } from "echarts/core";
import {
  getDotAgingApi,
  getExpiryDistributionApi,
  getInventoryMovementApi,
  getInventorySummaryApi,
  getInventoryTurnoverApi,
  getSlowMovingApi,
  getStockoutApi
} from "@/api/analysis";
import { getRepoListApi, type Repo } from "@/api/company/repo";
import { getStoreListApi, type Store } from "@/api/company/store";
import { useRenderIcon } from "@/components/ReIcon/src/hooks";
import { getEcharts } from "@/utils/echarts";
import { handleApiError } from "@/utils";
import Refresh from "~icons/ep/refresh";
import { movementColumns, slowMovingColumns, stockoutColumns } from "./columns";
import { buildAnalysisQuery, parseAnalysisFilters } from "../shared";
import { buildInventoryMovementRows } from "../transformers";

defineOptions({
  name: "AnalysisInventory"
});

const route = useRoute();
const router = useRouter();
const loading = ref(false);
const stores = ref<Store[]>([]);
const repos = ref<Repo[]>([]);

const dateRange = ref<[Date, Date] | null>(null);
const selectedStoreId = ref("");
const selectedRepoId = ref("");

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
let turnoverChart: EChartsType | null = null;
let expiryChart: EChartsType | null = null;
let movementChart: EChartsType | null = null;

const currentStore = computed(() =>
  stores.value.find(item => item.uid === selectedStoreId.value)
);

const repoOptions = computed(() => {
  const defaultRepoId = currentStore.value?.defaultRepositoryId;
  if (!defaultRepoId) return repos.value;
  return repos.value.filter(item => item.uid === defaultRepoId);
});

function formatAmount(val: string | number) {
  return Number(val).toLocaleString("zh-CN", { minimumFractionDigits: 2 });
}

async function getSummary() {
  const { data, code } = await getInventorySummaryApi({
    repoId: selectedRepoId.value || undefined
  });
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
    repoId: selectedRepoId.value || undefined
  });
  if (code !== 200) return;
  slowMovingList.value = (Array.isArray(data) ? data : data?.items) || [];
}

async function getStockout() {
  const { data, code } = await getStockoutApi({
    repoId: selectedRepoId.value || undefined
  });
  if (code !== 200) return;
  stockoutList.value = (Array.isArray(data) ? data : data?.items) || [];
}

async function getTurnover() {
  const { data, code } = await getInventoryTurnoverApi({
    repoId: selectedRepoId.value || undefined
  });
  if (code !== 200 || !data) return;
  turnoverData.value = {
    turnoverRate: data.turnoverRate || 0,
    averageDays: data.averageDays || 0,
    details: data.details || []
  };
  await updateTurnoverChart();
}

async function getExpiry() {
  const { data, code } = await getExpiryDistributionApi({
    repoId: selectedRepoId.value || undefined
  });
  if (code !== 200) return;
  expiryData.value = (Array.isArray(data) ? data : data?.buckets) || [];
  await updateExpiryChart();
}

async function getDotAging() {
  const { data, code } = await getDotAgingApi({
    repoId: selectedRepoId.value || undefined
  });
  if (code !== 200) return;
  dotAgingList.value = data?.list || [];
}

async function getMovement() {
  const { data, code } = await getInventoryMovementApi({
    repoId: selectedRepoId.value || undefined,
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

function applyRouteFilters() {
  const parsed = parseAnalysisFilters(route.query);
  dateRange.value = parsed.dateRange;
  selectedStoreId.value = parsed.storeId;
  selectedRepoId.value = parsed.repoId;
}

async function syncQuery() {
  await router.replace({
    query: buildAnalysisQuery({
      dateRange: dateRange.value,
      storeId: selectedStoreId.value || undefined,
      repoId: selectedRepoId.value || undefined
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

function handleResize() {
  turnoverChart?.resize();
  expiryChart?.resize();
  movementChart?.resize();
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
  window.addEventListener("resize", handleResize);
});

onUnmounted(() => {
  window.removeEventListener("resize", handleResize);
  turnoverChart?.dispose();
  expiryChart?.dispose();
  movementChart?.dispose();
});
</script>

<template>
  <div class="main p-4">
    <el-card class="mb-4">
      <div class="flex items-center justify-between">
        <div class="flex flex-wrap items-center gap-3">
          <span class="text-lg font-bold">库存数据总览</span>
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
        </div>
        <el-button :icon="useRenderIcon(Refresh)" circle @click="loadData" />
      </div>
    </el-card>

    <el-row :gutter="16" class="mb-4">
      <el-col :span="6">
        <el-card shadow="hover" class="text-center">
          <div class="text-gray-500 text-sm">库存总价值</div>
          <div class="mt-2 text-xl font-bold text-blue-600">
            ¥{{ formatAmount(summaryData.totalValue) }}
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

    <el-row :gutter="16" class="mb-4">
      <el-col :span="12">
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
      <el-col :span="12">
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

    <el-row :gutter="16" class="mb-4">
      <el-col :span="12">
        <el-card>
          <template #header>
            <span class="font-bold">滞销商品</span>
          </template>
          <pure-table
            :data="slowMovingList"
            :columns="slowMovingColumns"
            stripe
            height="360"
          />
        </el-card>
      </el-col>
      <el-col :span="12">
        <el-card>
          <template #header>
            <span class="font-bold">缺货预警</span>
          </template>
          <pure-table
            :data="stockoutList"
            :columns="stockoutColumns"
            stripe
            height="360"
          />
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="16" class="mb-4">
      <el-col :span="12">
        <el-card>
          <template #header>
            <span class="font-bold">临期分布</span>
          </template>
          <div ref="expiryChartRef" v-loading="loading" class="h-72" />
        </el-card>
      </el-col>
      <el-col :span="12">
        <el-card>
          <template #header>
            <span class="font-bold">DOT 库龄分布</span>
          </template>
          <pure-table
            :data="dotAgingList"
            stripe
            height="360"
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
