<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed } from "vue";
import {
  getSalesSummaryApi,
  getSalesTrendApi,
  getCustomerRankingApi,
  getProductRankingApi,
  getOperatorRankingApi
} from "@/api";
import { message } from "@/utils";
import { useRenderIcon } from "@/components/ReIcon/src/hooks";
import Refresh from "~icons/ep/refresh";
import dayjs from "dayjs";
import * as echarts from "echarts/core";
import { useColumns } from "./columns";

defineOptions({
  name: "AnalysisSales"
});

const { customerColumns, productColumns, operatorColumns } = useColumns();

const loading = ref(false);
const chartRef = ref<HTMLElement | null>(null);
let chartInstance: echarts.ECharts | null = null;

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

// 销售汇总数据
const summaryData = ref({
  totalAmount: "0",
  totalOrders: 0,
  paidAmount: "0",
  unpaidAmount: "0",
  averageOrderValue: "0",
  completionRate: 0
});

// 趋势数据
const trendData = ref<{ period: string; amount: string; count: number }[]>([]);

// 排行榜数据
const customerRanking = ref<unknown[]>([]);
const productRanking = ref<unknown[]>([]);
const operatorRanking = ref<unknown[]>([]);

// 当前选中的排行榜类型
const activeRankingTab = ref("customer");

const dateParams = computed(() => {
  if (!dateRange.value) return {};
  return {
    startDate: dayjs(dateRange.value[0]).format("YYYY-MM-DD"),
    endDate: dayjs(dateRange.value[1]).format("YYYY-MM-DD")
  };
});

// 格式化金额
const formatAmount = (val: string | number) => {
  const num = Number(val) / 100;
  return num.toLocaleString("zh-CN", { minimumFractionDigits: 2 });
};

const getSummary = async () => {
  try {
    const { data, code } = await getSalesSummaryApi(dateParams.value);
    if (code === 200 && data) {
      summaryData.value = {
        totalAmount: data.totalAmount || "0",
        totalOrders: data.totalOrders || 0,
        paidAmount: data.paidAmount || "0",
        unpaidAmount: data.unpaidAmount || "0",
        averageOrderValue: data.averageOrderValue || "0",
        completionRate: data.completionRate || 0
      };
    }
  } catch (error) {
    console.error("获取销售汇总失败:", error);
  }
};

const getTrend = async () => {
  try {
    const { data, code } = await getSalesTrendApi({
      ...dateParams.value,
      groupBy: "month"
    });
    if (code === 200 && data?.data) {
      trendData.value = data.data;
      updateChart();
    }
  } catch (error) {
    console.error("获取销售趋势失败:", error);
  }
};

const getRankings = async () => {
  try {
    const [customerRes, productRes, operatorRes] = await Promise.all([
      getCustomerRankingApi({ ...dateParams.value, limit: 10 }),
      getProductRankingApi({
        ...dateParams.value,
        limit: 10,
        orderBy: "amount"
      }),
      getOperatorRankingApi({
        ...dateParams.value,
        limit: 10,
        orderBy: "amount"
      })
    ]);

    if (customerRes.code === 200) {
      customerRanking.value = customerRes.data?.items || [];
    }
    if (productRes.code === 200) {
      productRanking.value = productRes.data?.items || [];
    }
    if (operatorRes.code === 200) {
      operatorRanking.value = operatorRes.data?.items || [];
    }
  } catch (error) {
    console.error("获取排行榜失败:", error);
  }
};

const updateChart = () => {
  if (!chartRef.value || !trendData.value.length) return;

  if (!chartInstance) {
    chartInstance = echarts.init(chartRef.value);
  }

  const option: echarts.EChartsCoreOption = {
    tooltip: {
      trigger: "axis",
      axisPointer: { type: "shadow" }
    },
    legend: {
      data: ["销售金额", "订单数"]
    },
    grid: {
      left: "3%",
      right: "4%",
      bottom: "3%",
      containLabel: true
    },
    xAxis: {
      type: "category",
      data: trendData.value.map(item => item.period)
    },
    yAxis: [
      {
        type: "value",
        name: "金额(元)",
        position: "left",
        axisLabel: {
          formatter: (val: number) => (val / 100).toLocaleString()
        }
      },
      {
        type: "value",
        name: "订单数",
        position: "right"
      }
    ],
    series: [
      {
        name: "销售金额",
        type: "bar",
        data: trendData.value.map(item => Number(item.amount)),
        itemStyle: { color: "#409EFF" }
      },
      {
        name: "订单数",
        type: "line",
        yAxisIndex: 1,
        data: trendData.value.map(item => item.count),
        itemStyle: { color: "#67C23A" }
      }
    ]
  };

  chartInstance.setOption(option);
};

const loadData = async () => {
  loading.value = true;
  try {
    await Promise.all([getSummary(), getTrend(), getRankings()]);
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "加载数据失败";
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
      <el-col :span="4">
        <el-card shadow="hover" class="text-center">
          <div class="text-gray-500 text-sm">销售总额</div>
          <div class="text-xl font-bold text-blue-500 mt-2">
            ¥{{ formatAmount(summaryData.totalAmount) }}
          </div>
        </el-card>
      </el-col>
      <el-col :span="4">
        <el-card shadow="hover" class="text-center">
          <div class="text-gray-500 text-sm">订单数量</div>
          <div class="text-xl font-bold text-green-500 mt-2">
            {{ summaryData.totalOrders }}
          </div>
        </el-card>
      </el-col>
      <el-col :span="4">
        <el-card shadow="hover" class="text-center">
          <div class="text-gray-500 text-sm">已收款</div>
          <div class="text-xl font-bold text-emerald-500 mt-2">
            ¥{{ formatAmount(summaryData.paidAmount) }}
          </div>
        </el-card>
      </el-col>
      <el-col :span="4">
        <el-card shadow="hover" class="text-center">
          <div class="text-gray-500 text-sm">未收款</div>
          <div class="text-xl font-bold text-orange-500 mt-2">
            ¥{{ formatAmount(summaryData.unpaidAmount) }}
          </div>
        </el-card>
      </el-col>
      <el-col :span="4">
        <el-card shadow="hover" class="text-center">
          <div class="text-gray-500 text-sm">平均订单金额</div>
          <div class="text-xl font-bold text-purple-500 mt-2">
            ¥{{ formatAmount(summaryData.averageOrderValue) }}
          </div>
        </el-card>
      </el-col>
      <el-col :span="4">
        <el-card shadow="hover" class="text-center">
          <div class="text-gray-500 text-sm">完成率</div>
          <div class="text-xl font-bold text-cyan-500 mt-2">
            {{ summaryData.completionRate }}%
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 趋势图表 -->
    <el-card class="mb-4">
      <template #header>
        <span class="font-bold">销售趋势</span>
      </template>
      <div ref="chartRef" v-loading="loading" class="h-80" />
    </el-card>

    <!-- 排行榜 -->
    <el-card>
      <template #header>
        <span class="font-bold">排行榜</span>
      </template>
      <el-tabs v-model="activeRankingTab">
        <el-tab-pane label="客户排行" name="customer">
          <pure-table
            stripe
            max-height="300"
            :loading="loading"
            :data="customerRanking"
            :columns="customerColumns"
          />
        </el-tab-pane>
        <el-tab-pane label="商品排行" name="product">
          <pure-table
            stripe
            max-height="300"
            :loading="loading"
            :data="productRanking"
            :columns="productColumns"
          />
        </el-tab-pane>
        <el-tab-pane label="员工排行" name="operator">
          <pure-table
            stripe
            max-height="300"
            :loading="loading"
            :data="operatorRanking"
            :columns="operatorColumns"
          />
        </el-tab-pane>
      </el-tabs>
    </el-card>
  </div>
</template>
