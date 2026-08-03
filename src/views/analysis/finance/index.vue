<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed, nextTick } from "vue";
import {
  getIncomeExpenseSummaryApi,
  getCashFlowApi,
  getFundReportApi
} from "@/api/analysis";
import { message, handleApiError } from "@/utils";
import dayjs from "dayjs";
import AnalysisDateToolbar from "../components/AnalysisDateToolbar.vue";
import {
  createDefaultAnalysisFilterState,
  inferGroupBy,
  toRequiredDateParams,
  type AnalysisGroupBy
} from "../shared";
import type { EChartsType } from "echarts/core";
import { getEcharts } from "@/utils/echarts";
import {
  formatYuanAmount,
  mapCashFlowSegments,
  mapFundReportBalanceTrend,
  mapIncomeExpenseSummaryCards,
  toChartNumber
} from "../transformers";

defineOptions({
  name: "AnalysisFinance"
});

const loading = ref(false);

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

const summaryData = ref(mapIncomeExpenseSummaryCards(null));
const cashFlowSegments = ref(mapCashFlowSegments(null));
const balanceTrend = ref(mapFundReportBalanceTrend(null));
const netCashFlow = ref("0");

const cashFlowChartRef = ref<HTMLElement | null>(null);
const balanceChartRef = ref<HTMLElement | null>(null);
let cashFlowChart: EChartsType | null = null;
let balanceChart: EChartsType | null = null;

const dateParams = computed(() => toRequiredDateParams(dateRange.value));

const getSummary = async () => {
  try {
    const { data, code } = await getIncomeExpenseSummaryApi(dateParams.value);
    if (code === 200 && data) {
      summaryData.value = mapIncomeExpenseSummaryCards(
        data,
        summaryData.value.currentBalance
      );
    }
  } catch (error) {
    handleApiError(error, "获取收支汇总失败");
  }
};

const getCashFlow = async () => {
  try {
    const { data, code } = await getCashFlowApi(dateParams.value);
    if (code === 200 && data) {
      cashFlowSegments.value = mapCashFlowSegments(data);
      netCashFlow.value = data.netCashFlow || "0";
      nextTick(() => void updateCashFlowChart());
    }
  } catch (error) {
    handleApiError(error, "获取现金流失败");
  }
};

const getBalance = async () => {
  try {
    const spanDays =
      dateRange.value != null
        ? dayjs(dateRange.value[1]).diff(dayjs(dateRange.value[0]), "day")
        : 30;
    const reportType = spanDays > 62 ? "monthly" : "daily";
    const { data, code } = await getFundReportApi({
      ...dateParams.value,
      reportType
    });
    if (code === 200 && data) {
      balanceTrend.value = mapFundReportBalanceTrend(data);
      summaryData.value = {
        ...summaryData.value,
        currentBalance: data.totalEndBalance || "0"
      };
      nextTick(() => void updateBalanceChart());
    }
  } catch (error) {
    handleApiError(error, "获取资金日报失败");
  }
};

const updateCashFlowChart = async () => {
  if (!cashFlowChartRef.value) return;
  if (!cashFlowChart) {
    const echarts = await getEcharts();
    cashFlowChart = echarts.init(cashFlowChartRef.value);
  }
  const chart = cashFlowChart;
  const segments = cashFlowSegments.value;

  chart.setOption({
    tooltip: {
      trigger: "axis",
      formatter: (params: Array<{ name: string; value: number }>) => {
        const item = Array.isArray(params) ? params[0] : params;
        if (!item) return "";
        return `${item.name}<br/>净额：¥${formatYuanAmount(item.value)}`;
      }
    },
    grid: { left: "3%", right: "4%", bottom: "3%", containLabel: true },
    xAxis: {
      type: "category",
      data: segments.map(s => s.name)
    },
    yAxis: {
      type: "value",
      name: "金额(元)",
      axisLabel: {
        formatter: (val: number) => val.toLocaleString()
      }
    },
    series: [
      {
        name: "净现金流",
        type: "bar",
        data: segments.map(s => s.value),
        itemStyle: {
          color: (params: { value: number }) =>
            params.value >= 0 ? "#67C23A" : "#F56C6C"
        }
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
  const chart = balanceChart;

  chart.setOption({
    tooltip: {
      trigger: "axis",
      formatter: (params: Array<{ name: string; value: number }>) => {
        const item = Array.isArray(params) ? params[0] : params;
        if (!item) return "";
        return `${item.name}<br/>期末余额：¥${formatYuanAmount(item.value)}`;
      }
    },
    xAxis: {
      type: "category",
      data: balanceTrend.value.map(d => d.period)
    },
    yAxis: {
      type: "value",
      name: "余额(元)",
      axisLabel: {
        formatter: (val: number) => val.toLocaleString()
      }
    },
    series: [
      {
        type: "line",
        smooth: true,
        areaStyle: { opacity: 0.3 },
        data: balanceTrend.value.map(d => toChartNumber(d.balance)),
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
    <el-card class="mb-4">
      <div class="flex items-center justify-between">
        <AnalysisDateToolbar
          v-model:date-range="dateRange"
          v-model:group-by="groupBy"
          :show-group-by="false"
          :loading="loading"
          @change="handleDateChange"
          @refresh="loadData"
        />
      </div>
    </el-card>

    <el-row :gutter="16" class="mb-4">
      <el-col :span="6">
        <el-card shadow="hover" class="text-center">
          <div class="text-gray-500 text-sm">总收入</div>
          <div class="text-xl font-bold text-green-500 mt-2">
            ¥{{ formatYuanAmount(summaryData.totalIncome) }}
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover" class="text-center">
          <div class="text-gray-500 text-sm">总支出</div>
          <div class="text-xl font-bold text-red-500 mt-2">
            ¥{{ formatYuanAmount(summaryData.totalExpense) }}
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover" class="text-center">
          <div class="text-gray-500 text-sm">净收入 / 净现金流</div>
          <div class="text-xl font-bold text-blue-500 mt-2">
            ¥{{ formatYuanAmount(summaryData.netIncome) }}
          </div>
          <div class="text-xs text-gray-400 mt-1">
            活动净额 ¥{{ formatYuanAmount(netCashFlow) }}
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover" class="text-center">
          <div class="text-gray-500 text-sm">期末余额</div>
          <div class="text-xl font-bold text-orange-500 mt-2">
            ¥{{ formatYuanAmount(summaryData.currentBalance) }}
          </div>
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="16">
      <el-col :span="12">
        <el-card>
          <template #header>
            <span class="font-bold">现金流构成（经营/投资/筹资）</span>
          </template>
          <div ref="cashFlowChartRef" v-loading="loading" class="h-80" />
        </el-card>
      </el-col>
      <el-col :span="12">
        <el-card>
          <template #header>
            <span class="font-bold">资金余额趋势（fund/report）</span>
          </template>
          <div ref="balanceChartRef" v-loading="loading" class="h-80" />
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>
