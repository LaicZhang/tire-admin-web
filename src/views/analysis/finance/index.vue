<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed, nextTick } from "vue";
import {
  getIncomeExpenseSummaryApi,
  getCashFlowApi,
  getBalanceTrendApi
} from "@/api/analysis";
import { message } from "@/utils/message";
import { useRenderIcon } from "@/components/ReIcon/src/hooks";
import Refresh from "~icons/ep/refresh";
import dayjs from "dayjs";
import type { ECharts } from "echarts";
import { getEcharts } from "@/utils/echarts";

defineOptions({
  name: "AnalysisFinance"
});

const loading = ref(false);

// 日期范围筛选
const dateRange = ref<[Date, Date] | null>(null);
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
    text: "本年度",
    value: () => {
      const end = new Date();
      const start = new Date(new Date().getFullYear(), 0, 1);
      return [start, end];
    }
  }
];

// 收支汇总
const summaryData = ref({
  totalIncome: "0",
  totalExpense: "0",
  netCashFlow: "0",
  currentBalance: "0"
});

// Chart data interfaces
interface CashFlowTrendItem {
  period: string;
  income?: number | string;
  expense?: number | string;
  netFlow?: number | string;
}

interface BalanceTrendItem {
  date?: string;
  period?: string;
  balance?: number | string;
}

// 现金流趋势
const cashFlowTrend = ref<CashFlowTrendItem[]>([]);
// 账户余额趋势
const balanceTrend = ref<BalanceTrendItem[]>([]);

// 图表
const cashFlowChartRef = ref<HTMLElement | null>(null);
const balanceChartRef = ref<HTMLElement | null>(null);
let cashFlowChart: ECharts | null = null;
let balanceChart: ECharts | null = null;

const dateParams = computed(() => {
  if (!dateRange.value) return {};
  return {
    startDate: dayjs(dateRange.value[0]).format("YYYY-MM-DD"),
    endDate: dayjs(dateRange.value[1]).format("YYYY-MM-DD")
  };
});

const formatAmount = (val: string | number) => {
  const num = Number(val) / 100;
  return num.toLocaleString("zh-CN", { minimumFractionDigits: 2 });
};

const getSummary = async () => {
  try {
    const { data, code } = await getIncomeExpenseSummaryApi(dateParams.value);
    if (code === 200 && data) {
      summaryData.value = {
        totalIncome: data.totalIncome || "0",
        totalExpense: data.totalExpense || "0",
        netCashFlow: data.netCashFlow || "0",
        currentBalance: data.currentBalance || "0"
      };
    }
  } catch (error) {
    console.error("获取收支汇总失败:", error);
  }
};

const getCashFlow = async () => {
  try {
    const { data, code } = await getCashFlowApi({
      ...dateParams.value,
      groupBy: "month"
    });
    if (code === 200 && data) {
      cashFlowTrend.value = (data.trend ||
        data.data ||
        []) as CashFlowTrendItem[];
      nextTick(() => void updateCashFlowChart());
    }
  } catch (error) {
    console.error("获取现金流失败:", error);
  }
};

const getBalance = async () => {
  try {
    const { data, code } = await getBalanceTrendApi(dateParams.value);
    if (code === 200 && data) {
      balanceTrend.value = (data.trend ||
        data.data ||
        []) as BalanceTrendItem[];
      nextTick(() => void updateBalanceChart());
    }
  } catch (error) {
    console.error("获取余额趋势失败:", error);
  }
};

const updateCashFlowChart = async () => {
  if (!cashFlowChartRef.value) return;
  if (!cashFlowChart) {
    const echarts = await getEcharts();
    cashFlowChart = echarts.init(cashFlowChartRef.value);
  }

  const periods = cashFlowTrend.value.map((d: CashFlowTrendItem) => d.period);

  cashFlowChart.setOption({
    tooltip: { trigger: "axis" },
    legend: { data: ["收入", "支出", "净现金流"] },
    grid: { left: "3%", right: "4%", bottom: "3%", containLabel: true },
    xAxis: { type: "category", data: periods },
    yAxis: {
      type: "value",
      name: "金额(元)",
      axisLabel: { formatter: (val: number) => (val / 100).toLocaleString() }
    },
    series: [
      {
        name: "收入",
        type: "bar",
        data: cashFlowTrend.value.map((d: CashFlowTrendItem) =>
          Number(d.income || 0)
        ),
        itemStyle: { color: "#67C23A" }
      },
      {
        name: "支出",
        type: "bar",
        data: cashFlowTrend.value.map((d: CashFlowTrendItem) =>
          Number(d.expense || 0)
        ),
        itemStyle: { color: "#F56C6C" }
      },
      {
        name: "净现金流",
        type: "line",
        data: cashFlowTrend.value.map((d: CashFlowTrendItem) =>
          Number(d.netFlow || 0)
        ),
        itemStyle: { color: "#409EFF" }
      }
    ]
  });
};

const updateBalanceChart = async () => {
  if (!balanceChartRef.value) return;
  if (!balanceChart) {
    const echarts = await getEcharts();
    balanceChart = echarts.init(balanceChartRef.value);
  }

  balanceChart.setOption({
    tooltip: { trigger: "axis" },
    xAxis: {
      type: "category",
      data: balanceTrend.value.map((d: BalanceTrendItem) => d.date || d.period)
    },
    yAxis: {
      type: "value",
      name: "余额(元)",
      axisLabel: { formatter: (val: number) => (val / 100).toLocaleString() }
    },
    series: [
      {
        type: "line",
        smooth: true,
        areaStyle: { opacity: 0.3 },
        data: balanceTrend.value.map((d: BalanceTrendItem) =>
          Number(d.balance || 0)
        ),
        itemStyle: { color: "#E6A23C" }
      }
    ]
  });
};

const handleResize = () => {
  cashFlowChart?.resize();
  balanceChart?.resize();
};

const loadData = async () => {
  loading.value = true;
  try {
    await Promise.all([getSummary(), getCashFlow(), getBalance()]);
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "加载资金数据失败";
    message(msg, { type: "error" });
  } finally {
    loading.value = false;
  }
};

const handleDateChange = () => {
  loadData();
};

onMounted(() => {
  loadData();
  window.addEventListener("resize", handleResize);
});

onUnmounted(() => {
  window.removeEventListener("resize", handleResize);
  cashFlowChart?.dispose();
  balanceChart?.dispose();
});
</script>

<template>
  <div class="main p-4">
    <!-- 筛选栏 -->
    <el-card class="mb-4">
      <div class="flex items-center justify-between">
        <el-date-picker
          v-model="dateRange"
          type="daterange"
          range-separator="至"
          start-placeholder="开始日期"
          end-placeholder="结束日期"
          :shortcuts="shortcuts"
          @change="handleDateChange"
        />
        <el-button :icon="useRenderIcon(Refresh)" circle @click="loadData" />
      </div>
    </el-card>

    <!-- 汇总卡片 -->
    <el-row :gutter="16" class="mb-4">
      <el-col :span="6">
        <el-card shadow="hover" class="text-center">
          <div class="text-gray-500 text-sm">总收入</div>
          <div class="text-xl font-bold text-green-500 mt-2">
            ¥{{ formatAmount(summaryData.totalIncome) }}
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover" class="text-center">
          <div class="text-gray-500 text-sm">总支出</div>
          <div class="text-xl font-bold text-red-500 mt-2">
            ¥{{ formatAmount(summaryData.totalExpense) }}
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover" class="text-center">
          <div class="text-gray-500 text-sm">净现金流</div>
          <div class="text-xl font-bold text-blue-500 mt-2">
            ¥{{ formatAmount(summaryData.netCashFlow) }}
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover" class="text-center">
          <div class="text-gray-500 text-sm">当前余额</div>
          <div class="text-xl font-bold text-orange-500 mt-2">
            ¥{{ formatAmount(summaryData.currentBalance) }}
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 图表 -->
    <el-row :gutter="16">
      <el-col :span="12">
        <el-card>
          <template #header>
            <span class="font-bold">现金流趋势</span>
          </template>
          <div ref="cashFlowChartRef" v-loading="loading" class="h-80" />
        </el-card>
      </el-col>
      <el-col :span="12">
        <el-card>
          <template #header>
            <span class="font-bold">账户余额趋势</span>
          </template>
          <div ref="balanceChartRef" v-loading="loading" class="h-80" />
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>
