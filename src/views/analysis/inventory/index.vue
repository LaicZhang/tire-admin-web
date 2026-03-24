<script setup lang="ts">
import { ref, onMounted, onUnmounted, nextTick, computed, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import {
  getInventorySummaryApi,
  getSlowMovingApi,
  getStockoutApi,
  getInventoryTurnoverApi,
  getExpiryDistributionApi,
  getDotAgingApi
} from "@/api/analysis";
import { getStoreListApi, type Store } from "@/api/company/store";
import { getRepoListApi, type Repo } from "@/api/company/repo";
import { message, handleApiError } from "@/utils";
import { useRenderIcon } from "@/components/ReIcon/src/hooks";
import { slowMovingColumns, stockoutColumns } from "./columns";
import Refresh from "~icons/ep/refresh";
import type { EChartsType } from "echarts/core";
import { getEcharts } from "@/utils/echarts";
import { buildAnalysisQuery, parseAnalysisFilters } from "../shared";

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

// 库存汇总数据
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

// Data interfaces
interface TurnoverDetailItem {
  repoName?: string;
  name?: string;
  turnoverRate?: number;
}

interface TurnoverData {
  turnoverRate: number;
  averageDays: number;
  details: TurnoverDetailItem[];
}

interface ExpiryDataItem {
  label?: string;
  bucket?: string;
  count?: number;
  quantity?: number;
}

interface SlowMovingItem {
  tireName?: string;
  repoName?: string;
  quantity?: number;
  lastMoveDate?: string;
}

interface StockoutItem {
  tireName?: string;
  currentQuantity?: number;
  safetyStock?: number;
  suggestPurchase?: number;
}

// 滞销商品
const slowMovingList = ref<SlowMovingItem[]>([]);
// 缺货分析
const stockoutList = ref<StockoutItem[]>([]);
// 库存周转
const turnoverData = ref<TurnoverData>({
  turnoverRate: 0,
  averageDays: 0,
  details: []
});
// 临期分布
const expiryData = ref<ExpiryDataItem[]>([]);
const dotAgingList = ref<
  Array<{
    repoName?: string;
    tireName?: string;
    dotYear?: number;
    dotWeek?: number;
    count?: number;
  }>
>([]);

// 图表引用
const turnoverChartRef = ref<HTMLElement | null>(null);
const expiryChartRef = ref<HTMLElement | null>(null);
let turnoverChart: EChartsType | null = null;
let expiryChart: EChartsType | null = null;

const currentStore = computed(() =>
  stores.value.find(item => item.uid === selectedStoreId.value)
);

const repoOptions = computed(() => {
  const defaultRepoId = currentStore.value?.defaultRepositoryId;
  if (!defaultRepoId) return repos.value;
  return repos.value.filter(item => item.uid === defaultRepoId);
});

// 格式化金额
const formatAmount = (val: string | number) => {
  const num = Number(val);
  return num.toLocaleString("zh-CN", { minimumFractionDigits: 2 });
};

const getSummary = async () => {
  try {
    const { data, code } = await getInventorySummaryApi({
      repoId: selectedRepoId.value || undefined
    });
    if (code === 200 && data) {
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
  } catch (error) {
    handleApiError(error, "获取库存汇总失败");
  }
};

const getSlowMoving = async () => {
  try {
    const { data, code } = await getSlowMovingApi({
      days: 90,
      repoId: selectedRepoId.value || undefined
    });
    if (code === 200) {
      slowMovingList.value = (
        Array.isArray(data) ? data : data.items || []
      ) as SlowMovingItem[];
    }
  } catch (error) {
    handleApiError(error, "获取滞销数据失败");
  }
};

const getStockout = async () => {
  try {
    const { data, code } = await getStockoutApi({
      repoId: selectedRepoId.value || undefined
    });
    if (code === 200) {
      stockoutList.value = (
        Array.isArray(data) ? data : data.items || []
      ) as StockoutItem[];
    }
  } catch (error) {
    handleApiError(error, "获取缺货数据失败");
  }
};

const getTurnover = async () => {
  try {
    const { data, code } = await getInventoryTurnoverApi({
      repoId: selectedRepoId.value || undefined
    });
    if (code === 200 && data) {
      turnoverData.value = {
        turnoverRate: data.turnoverRate || 0,
        averageDays: data.averageDays || 0,
        details: data.details || []
      };
      nextTick(() => void updateTurnoverChart());
    }
  } catch (error) {
    handleApiError(error, "获取周转率失败");
  }
};

const getExpiry = async () => {
  try {
    const { data, code } = await getExpiryDistributionApi({
      repoId: selectedRepoId.value || undefined
    });
    if (code === 200) {
      expiryData.value = (
        Array.isArray(data) ? data : data.buckets || []
      ) as ExpiryDataItem[];
      nextTick(() => void updateExpiryChart());
    }
  } catch (error) {
    handleApiError(error, "获取临期分布失败");
  }
};

const getDotAging = async () => {
  try {
    const { data, code } = await getDotAgingApi({
      repoId: selectedRepoId.value || undefined
    });
    if (code === 200) {
      dotAgingList.value = data?.list || [];
    }
  } catch (error) {
    handleApiError(error, "获取 DOT 库龄分布失败");
  }
};

const updateTurnoverChart = async () => {
  if (!turnoverChartRef.value) return;
  if (!turnoverChart) {
    const echarts = await getEcharts();
    turnoverChart = echarts.init(turnoverChartRef.value);
  }
  const chart = turnoverChart;
  const details = turnoverData.value.details || [];
  chart.setOption({
    tooltip: { trigger: "axis" },
    xAxis: {
      type: "category",
      data: details.map((d: TurnoverDetailItem) => d.repoName || d.name)
    },
    yAxis: { type: "value", name: "周转次数" },
    series: [
      {
        type: "bar",
        data: details.map((d: TurnoverDetailItem) => d.turnoverRate || 0),
        itemStyle: { color: "#409EFF" }
      }
    ]
  });
};

const updateExpiryChart = async () => {
  if (!expiryChartRef.value) return;
  if (!expiryChart) {
    const echarts = await getEcharts();
    expiryChart = echarts.init(expiryChartRef.value);
  }
  const chart = expiryChart;
  chart.setOption({
    tooltip: { trigger: "item" },
    series: [
      {
        type: "pie",
        radius: "60%",
        data: expiryData.value.map((d: ExpiryDataItem) => ({
          name: d.label || d.bucket,
          value: d.count || d.quantity
        }))
      }
    ]
  });
};

const handleResize = () => {
  turnoverChart?.resize();
  expiryChart?.resize();
};

const loadData = async () => {
  loading.value = true;
  try {
    await Promise.all([
      getSummary(),
      getSlowMoving(),
      getStockout(),
      getTurnover(),
      getExpiry(),
      getDotAging()
    ]);
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "加载数据失败";
    message(msg, { type: "error" });
  } finally {
    loading.value = false;
  }
};

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

onMounted(() => {
  void loadOptions();
  window.addEventListener("resize", handleResize);
});

watch(
  () => route.query,
  () => {
    applyRouteFilters();
    void loadData();
  },
  { immediate: true }
);

onUnmounted(() => {
  window.removeEventListener("resize", handleResize);
  turnoverChart?.dispose();
  expiryChart?.dispose();
});
</script>

<template>
  <div class="main p-4">
    <!-- 顶部操作栏 -->
    <el-card class="mb-4">
      <div class="flex items-center justify-between">
        <div class="flex flex-wrap items-center gap-3">
          <span class="font-bold text-lg">库存数据总览</span>
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

    <!-- 汇总卡片 -->
    <el-row :gutter="16" class="mb-4">
      <el-col :span="6">
        <el-card shadow="hover" class="text-center">
          <div class="text-gray-500 text-sm">库存总价值</div>
          <div class="text-xl font-bold text-blue-500 mt-2">
            ¥{{ formatAmount(summaryData.totalValue) }}
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover" class="text-center">
          <div class="text-gray-500 text-sm">库存商品总数</div>
          <div class="text-xl font-bold text-green-500 mt-2">
            {{ summaryData.totalCount }}
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover" class="text-center">
          <div class="text-gray-500 text-sm">待入库/待发货</div>
          <div class="text-xl font-bold text-orange-500 mt-2">
            {{ summaryData.toBeStockedCount }} /
            {{ summaryData.toBeShippedCount }}
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover" class="text-center">
          <div class="text-gray-500 text-sm">库存预警商品数</div>
          <div class="text-xl font-bold text-red-500 mt-2">
            {{ summaryData.belowAlarmCount }}
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 分析表格 -->
    <el-row :gutter="16">
      <el-col :span="12">
        <el-card>
          <template #header>
            <div class="flex justify-between items-center">
              <span class="font-bold">滞销商品 (90天未动)</span>
            </div>
          </template>
          <pure-table
            :data="slowMovingList"
            :columns="slowMovingColumns"
            stripe
            height="400"
          />
        </el-card>
      </el-col>
      <el-col :span="12">
        <el-card>
          <template #header>
            <div class="flex justify-between items-center">
              <span class="font-bold">缺货预警</span>
            </div>
          </template>
          <pure-table
            :data="stockoutList"
            :columns="stockoutColumns"
            stripe
            height="400"
          />
        </el-card>
      </el-col>
    </el-row>

    <!-- 库存周转率与临期分布 -->
    <el-row :gutter="16" class="mt-4">
      <el-col :span="12">
        <el-card>
          <template #header>
            <div class="flex justify-between items-center">
              <span class="font-bold">库存周转率</span>
              <el-tag type="info" size="small">
                平均周转天数: {{ turnoverData.averageDays }} 天
              </el-tag>
            </div>
          </template>
          <div ref="turnoverChartRef" class="h-64" />
        </el-card>
      </el-col>
      <el-col :span="12">
        <el-card>
          <template #header>
            <div class="flex justify-between items-center">
              <span class="font-bold">临期分布</span>
            </div>
          </template>
          <div ref="expiryChartRef" class="h-64" />
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="16" class="mt-4">
      <el-col :span="24">
        <el-card>
          <template #header>
            <div class="flex justify-between items-center">
              <span class="font-bold">DOT 库龄分布</span>
            </div>
          </template>
          <pure-table
            :data="dotAgingList"
            stripe
            height="360"
            :columns="[
              { label: '门店/仓库', prop: 'repoName', minWidth: 140 },
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
