<script setup lang="ts">
import { ref, onMounted, onUnmounted, nextTick, h } from "vue";
import {
  getInventorySummaryApi,
  getSlowMovingApi,
  getStockoutApi,
  getInventoryTurnoverApi,
  getExpiryDistributionApi
} from "@/api/analysis";
import { message } from "@/utils/message";
import { useRenderIcon } from "@/components/ReIcon/src/hooks";
import Refresh from "~icons/ep/refresh";
import type { ECharts } from "echarts";
import { getEcharts } from "@/utils/echarts";

defineOptions({
  name: "AnalysisInventory"
});

const loading = ref(false);

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

// 表格列定义
const slowMovingColumns: TableColumnList = [
  {
    label: "商品名称",
    prop: "tireName"
  },
  {
    label: "所在仓库",
    prop: "repoName"
  },
  {
    label: "库存数量",
    prop: "quantity",
    width: 100
  },
  {
    label: "最后异动时间",
    prop: "lastMoveDate"
  }
];

const stockoutColumns: TableColumnList = [
  {
    label: "商品名称",
    prop: "tireName"
  },
  {
    label: "当前库存",
    prop: "currentQuantity",
    width: 100,
    cellRenderer: ({ row }) =>
      h(
        "span",
        { class: "text-red-500 font-bold" },
        (row as StockoutItem).currentQuantity
      )
  },
  {
    label: "安全库存",
    prop: "safetyStock",
    width: 100
  },
  {
    label: "建议采购",
    prop: "suggestPurchase"
  }
];

// 图表引用
const turnoverChartRef = ref<HTMLElement | null>(null);
const expiryChartRef = ref<HTMLElement | null>(null);
let turnoverChart: ECharts | null = null;
let expiryChart: ECharts | null = null;

// 格式化金额
const formatAmount = (val: string | number) => {
  const num = Number(val) / 100;
  return num.toLocaleString("zh-CN", { minimumFractionDigits: 2 });
};

const getSummary = async () => {
  try {
    const { data, code } = await getInventorySummaryApi();
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
    console.error("获取库存汇总失败:", error);
  }
};

const getSlowMoving = async () => {
  try {
    const { data, code } = await getSlowMovingApi({ days: 90 });
    if (code === 200) {
      slowMovingList.value = (
        Array.isArray(data) ? data : data.items || []
      ) as SlowMovingItem[];
    }
  } catch (error) {
    console.error("获取滞销数据失败:", error);
  }
};

const getStockout = async () => {
  try {
    const { data, code } = await getStockoutApi();
    if (code === 200) {
      stockoutList.value = (
        Array.isArray(data) ? data : data.items || []
      ) as StockoutItem[];
    }
  } catch (error) {
    console.error("获取缺货数据失败:", error);
  }
};

const getTurnover = async () => {
  try {
    const { data, code } = await getInventoryTurnoverApi();
    if (code === 200 && data) {
      turnoverData.value = {
        turnoverRate: data.turnoverRate || 0,
        averageDays: data.averageDays || 0,
        details: data.details || []
      };
      nextTick(() => void updateTurnoverChart());
    }
  } catch (error) {
    console.error("获取周转率失败:", error);
  }
};

const getExpiry = async () => {
  try {
    const { data, code } = await getExpiryDistributionApi({});
    if (code === 200) {
      expiryData.value = (
        Array.isArray(data) ? data : data.buckets || []
      ) as ExpiryDataItem[];
      nextTick(() => void updateExpiryChart());
    }
  } catch (error) {
    console.error("获取临期分布失败:", error);
  }
};

const updateTurnoverChart = async () => {
  if (!turnoverChartRef.value) return;
  if (!turnoverChart) {
    const echarts = await getEcharts();
    turnoverChart = echarts.init(turnoverChartRef.value);
  }
  const details = turnoverData.value.details || [];
  turnoverChart.setOption({
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
  expiryChart.setOption({
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
      getExpiry()
    ]);
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "加载数据失败";
    message(msg, { type: "error" });
  } finally {
    loading.value = false;
  }
};

onMounted(() => {
  loadData();
  window.addEventListener("resize", handleResize);
});

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
        <span class="font-bold text-lg">库存数据总览</span>
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
  </div>
</template>
