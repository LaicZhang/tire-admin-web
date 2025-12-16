<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed, nextTick } from "vue";
import { getGrossProfitApi, getNetProfitApi } from "@/api/analysis";
import { message } from "@/utils/message";
import { useRenderIcon } from "@/components/ReIcon/src/hooks";
import Refresh from "~icons/ep/refresh";
import dayjs from "dayjs";
import * as echarts from "echarts";

defineOptions({
  name: "AnalysisProfit"
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
    text: "最近三个月",
    value: () => {
      const end = new Date();
      const start = new Date();
      start.setTime(start.getTime() - 3600 * 1000 * 24 * 90);
      return [start, end];
    }
  }
];

// 利润汇总
const profitSummary = ref({
  grossProfit: "0",
  netProfit: "0",
  salesRevenue: "0",
  salesCost: "0",
  operatingExpense: "0"
});

// 趋势数据
const grossTrend = ref<any[]>([]);
const netTrend = ref<any[]>([]);

// 图表
const chartRef = ref<HTMLElement | null>(null);
let chartInstance: echarts.ECharts | null = null;

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

const getGrossProfit = async () => {
  try {
    const { data, code } = await getGrossProfitApi({
      ...dateParams.value,
      groupBy: "month"
    });
    if (code === 200 && data) {
      profitSummary.value.grossProfit = data.totalGrossProfit || "0";
      profitSummary.value.salesRevenue = data.totalRevenue || "0";
      profitSummary.value.salesCost = data.totalCost || "0";
      grossTrend.value = data.trend || [];
    }
  } catch (error) {
    console.error("获取毛利失败:", error);
  }
};

const getNetProfit = async () => {
  try {
    const { data, code } = await getNetProfitApi({
      ...dateParams.value,
      groupBy: "month"
    });
    if (code === 200 && data) {
      profitSummary.value.netProfit = data.totalNetProfit || "0";
      profitSummary.value.operatingExpense = data.totalExpense || "0";
      netTrend.value = data.trend || [];
    }
  } catch (error) {
    console.error("获取净利润失败:", error);
  }
};

const updateChart = () => {
  if (!chartRef.value) return;
  if (!chartInstance) {
    chartInstance = echarts.init(chartRef.value);
  }

  // Merge trends (assuming same periods)
  const periods = grossTrend.value.map((d: any) => d.period);

  chartInstance.setOption({
    tooltip: { trigger: "axis" },
    legend: { data: ["销售收入", "销售成本", "毛利润", "净利润"] },
    grid: { left: "3%", right: "4%", bottom: "3%", containLabel: true },
    xAxis: { type: "category", data: periods },
    yAxis: {
      type: "value",
      name: "金额(元)",
      axisLabel: { formatter: (val: number) => (val / 100).toLocaleString() }
    },
    series: [
      {
        name: "销售收入",
        type: "bar",
        stack: "revenue",
        data: grossTrend.value.map((d: any) => Number(d.revenue || 0)),
        itemStyle: { color: "#409EFF" }
      },
      {
        name: "销售成本",
        type: "bar",
        stack: "cost",
        data: grossTrend.value.map((d: any) => Number(d.cost || 0)),
        itemStyle: { color: "#E6A23C" }
      },
      {
        name: "毛利润",
        type: "line",
        data: grossTrend.value.map((d: any) => Number(d.grossProfit || 0)),
        itemStyle: { color: "#67C23A" }
      },
      {
        name: "净利润",
        type: "line",
        data: netTrend.value.map((d: any) => Number(d.netProfit || 0)),
        itemStyle: { color: "#F56C6C" }
      }
    ]
  });
};

const loadData = async () => {
  loading.value = true;
  try {
    await Promise.all([getGrossProfit(), getNetProfit()]);
    nextTick(() => updateChart());
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "加载利润数据失败";
    message(msg, { type: "error" });
  } finally {
    loading.value = false;
  }
};

const handleDateChange = () => {
  loadData();
};

const handleResize = () => {
  chartInstance?.resize();
};

onMounted(() => {
  loadData();
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
      <el-col :span="5">
        <el-card shadow="hover" class="text-center">
          <div class="text-gray-500 text-sm">销售收入</div>
          <div class="text-xl font-bold text-blue-500 mt-2">
            ¥{{ formatAmount(profitSummary.salesRevenue) }}
          </div>
        </el-card>
      </el-col>
      <el-col :span="5">
        <el-card shadow="hover" class="text-center">
          <div class="text-gray-500 text-sm">销售成本</div>
          <div class="text-xl font-bold text-orange-500 mt-2">
            ¥{{ formatAmount(profitSummary.salesCost) }}
          </div>
        </el-card>
      </el-col>
      <el-col :span="5">
        <el-card shadow="hover" class="text-center">
          <div class="text-gray-500 text-sm">毛利润</div>
          <div class="text-xl font-bold text-green-500 mt-2">
            ¥{{ formatAmount(profitSummary.grossProfit) }}
          </div>
        </el-card>
      </el-col>
      <el-col :span="5">
        <el-card shadow="hover" class="text-center">
          <div class="text-gray-500 text-sm">运营费用</div>
          <div class="text-xl font-bold text-yellow-500 mt-2">
            ¥{{ formatAmount(profitSummary.operatingExpense) }}
          </div>
        </el-card>
      </el-col>
      <el-col :span="4">
        <el-card shadow="hover" class="text-center">
          <div class="text-gray-500 text-sm">净利润</div>
          <div class="text-xl font-bold text-red-500 mt-2">
            ¥{{ formatAmount(profitSummary.netProfit) }}
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 趋势图 -->
    <el-card>
      <template #header>
        <span class="font-bold">利润趋势</span>
      </template>
      <div ref="chartRef" v-loading="loading" class="h-96" />
    </el-card>
  </div>
</template>
