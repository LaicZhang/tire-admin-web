<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed, nextTick } from "vue";
import { getProfitStatementApi } from "@/api/analysis";
import { message, handleApiError } from "@/utils";
import { useRenderIcon } from "@/components/ReIcon/src/hooks";
import Refresh from "~icons/ep/refresh";
import dayjs from "dayjs";
import type { EChartsType } from "echarts/core";
import { getEcharts } from "@/utils/echarts";
import {
  formatYuanAmount,
  mapProfitStatementCards,
  mapProfitWaterfall,
  toChartNumber
} from "../transformers";

defineOptions({
  name: "AnalysisProfit"
});

const loading = ref(false);

const dateRange = ref<[Date, Date] | null>([
  dayjs().subtract(29, "day").toDate(),
  dayjs().toDate()
]);

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

const profitSummary = ref(mapProfitStatementCards(null));
const waterfall = ref(mapProfitWaterfall(null));

const chartRef = ref<HTMLElement | null>(null);
let chartInstance: EChartsType | null = null;

const dateParams = computed(() => {
  if (!dateRange.value) return {};
  return {
    startDate: dayjs(dateRange.value[0]).format("YYYY-MM-DD"),
    endDate: dayjs(dateRange.value[1]).format("YYYY-MM-DD")
  };
});

const getProfitStatement = async () => {
  try {
    const { data, code } = await getProfitStatementApi(dateParams.value);
    if (code === 200 && data) {
      profitSummary.value = mapProfitStatementCards(data);
      waterfall.value = mapProfitWaterfall(data);
    }
  } catch (error) {
    handleApiError(error, "获取利润表失败");
  }
};

const updateChart = async () => {
  if (!chartRef.value) return;
  if (!chartInstance) {
    const echarts = await getEcharts();
    chartInstance = echarts.init(chartRef.value);
  }
  const chart = chartInstance;
  const steps = waterfall.value;

  // Simple signed bar waterfall substitute for single-period statement
  chart.setOption({
    tooltip: {
      trigger: "axis",
      formatter: (params: Array<{ name: string; value: number }>) => {
        const item = Array.isArray(params) ? params[0] : params;
        if (!item) return "";
        return `${item.name}<br/>¥${formatYuanAmount(item.value)}`;
      }
    },
    grid: { left: "3%", right: "4%", bottom: "3%", containLabel: true },
    xAxis: {
      type: "category",
      data: steps.map(s => s.name)
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
        name: "利润构成",
        type: "bar",
        data: steps.map(s => ({
          value: toChartNumber(s.value),
          itemStyle: {
            color:
              s.kind === "decrease"
                ? "#F56C6C"
                : s.kind === "increase"
                  ? "#67C23A"
                  : "#409EFF"
          }
        }))
      }
    ]
  });
};

const loadData = async () => {
  loading.value = true;
  try {
    await getProfitStatement();
    nextTick(() => void updateChart());
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

    <el-row :gutter="16" class="mb-4">
      <el-col :span="4">
        <el-card shadow="hover" class="text-center">
          <div class="text-gray-500 text-sm">销售收入</div>
          <div class="text-xl font-bold text-blue-500 mt-2">
            ¥{{ formatYuanAmount(profitSummary.salesRevenue) }}
          </div>
        </el-card>
      </el-col>
      <el-col :span="4">
        <el-card shadow="hover" class="text-center">
          <div class="text-gray-500 text-sm">销售成本</div>
          <div class="text-xl font-bold text-orange-500 mt-2">
            ¥{{ formatYuanAmount(profitSummary.salesCost) }}
          </div>
        </el-card>
      </el-col>
      <el-col :span="4">
        <el-card shadow="hover" class="text-center">
          <div class="text-gray-500 text-sm">毛利润</div>
          <div class="text-xl font-bold text-green-500 mt-2">
            ¥{{ formatYuanAmount(profitSummary.grossProfit) }}
          </div>
          <div class="text-xs text-gray-400 mt-1">
            毛利率 {{ profitSummary.grossProfitRate.toFixed(1) }}%
          </div>
        </el-card>
      </el-col>
      <el-col :span="4">
        <el-card shadow="hover" class="text-center">
          <div class="text-gray-500 text-sm">营业费用</div>
          <div class="text-xl font-bold text-yellow-500 mt-2">
            ¥{{ formatYuanAmount(profitSummary.operatingExpense) }}
          </div>
        </el-card>
      </el-col>
      <el-col :span="4">
        <el-card shadow="hover" class="text-center">
          <div class="text-gray-500 text-sm">其他收入</div>
          <div class="text-xl font-bold text-teal-500 mt-2">
            ¥{{ formatYuanAmount(profitSummary.otherIncome) }}
          </div>
        </el-card>
      </el-col>
      <el-col :span="4">
        <el-card shadow="hover" class="text-center">
          <div class="text-gray-500 text-sm">净利润</div>
          <div class="text-xl font-bold text-red-500 mt-2">
            ¥{{ formatYuanAmount(profitSummary.netProfit) }}
          </div>
        </el-card>
      </el-col>
    </el-row>

    <el-card>
      <template #header>
        <div class="flex items-center justify-between">
          <span class="font-bold">利润构成（单期瀑布）</span>
          <span class="text-xs text-gray-400">
            订单 {{ profitSummary.salesOrderCount }} · 成本未知出库
            {{ profitSummary.unknownCostQuantity }}
          </span>
        </div>
      </template>
      <div ref="chartRef" v-loading="loading" class="h-96" />
    </el-card>
  </div>
</template>
