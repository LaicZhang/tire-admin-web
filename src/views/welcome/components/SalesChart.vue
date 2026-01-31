<script setup lang="ts">
import { ref, onMounted, onUnmounted } from "vue";
import { getPurchaseSalesApi } from "@/api";
import type { DailySummaryItem } from "@/api/dashboard";
import { handleApiError, message } from "@/utils";
import { getEcharts } from "@/utils/echarts";
import type { ECharts, EChartsOption } from "echarts";

defineOptions({
  name: "SalesChart"
});

const loading = ref(false);
const chartRef = ref<HTMLElement | null>(null);
let chartInstance: ECharts | null = null;

// 当前选择的天数 (7 或 30)
const selectedDays = ref(7);

// 数据
const dailySummary = ref<DailySummaryItem[]>([]);
const totalPurchase = ref("0");
const totalSales = ref("0");

// 格式化金额
const formatAmount = (val: string | number) => {
  const num = Number(val);
  if (isNaN(num)) return "0.00";
  return num.toLocaleString("zh-CN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
};

const loadData = async () => {
  loading.value = true;
  try {
    const { code, data, msg } = await getPurchaseSalesApi(selectedDays.value);
    if (code === 200 && data) {
      dailySummary.value = data.dailySummary || [];
      totalPurchase.value = data.totalPurchaseAmount || "0";
      totalSales.value = data.totalSalesAmount || "0";
      await updateChart();
    } else if (msg) {
      message(msg, { type: "warning" });
    }
  } catch (error) {
    handleApiError(error, "获取采购销售数据失败");
  } finally {
    loading.value = false;
  }
};

const updateChart = async () => {
  if (!chartRef.value) return;

  if (!chartInstance) {
    const echarts = await getEcharts();
    chartInstance = echarts.init(chartRef.value);
  }

  const dates = dailySummary.value.map(item => item.date);
  const purchaseData = dailySummary.value.map(item =>
    Number(item.purchaseAmount)
  );
  const salesData = dailySummary.value.map(item => Number(item.salesAmount));

  const echarts = await getEcharts();
  const option: EChartsOption = {
    tooltip: {
      trigger: "axis",
      axisPointer: {
        type: "cross",
        crossStyle: {
          color: "#999"
        }
      },
      formatter: (params: unknown) => {
        type TooltipItem = {
          axisValue?: string;
          marker?: string;
          seriesName?: string;
          value?: unknown;
        };

        const list = (
          Array.isArray(params) ? params : [params]
        ) as TooltipItem[];
        const axisValue = list[0]?.axisValue ? String(list[0].axisValue) : "";
        let result = `<div style="font-weight:600;margin-bottom:8px">${axisValue}</div>`;

        list.forEach(param => {
          const rawValue = param.value;
          const value = Array.isArray(rawValue)
            ? Number(rawValue[1])
            : Number(rawValue);

          result += `<div style="display:flex;justify-content:space-between;gap:16px">
	            <span>${param.marker || ""} ${param.seriesName || ""}</span>
	            <span style="font-weight:600">¥${formatAmount(value)}</span>
	          </div>`;
        });
        return result;
      }
    },
    legend: {
      data: ["采购金额", "销售金额"],
      bottom: 0,
      itemGap: 24
    },
    grid: {
      left: "3%",
      right: "4%",
      bottom: "12%",
      top: "10%",
      containLabel: true
    },
    xAxis: {
      type: "category",
      data: dates,
      axisPointer: {
        type: "shadow"
      },
      axisLabel: {
        formatter: (value: string) => value.slice(5) // 只显示 MM-DD
      }
    },
    yAxis: {
      type: "value",
      name: "金额 (元)",
      axisLabel: {
        formatter: (val: number) => {
          if (val >= 10000) return (val / 10000).toFixed(0) + "万";
          return val.toString();
        }
      },
      splitLine: {
        lineStyle: {
          type: "dashed",
          color: "#e5e7eb"
        }
      }
    },
    series: [
      {
        name: "采购金额",
        type: "bar",
        data: purchaseData,
        itemStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: "#22c55e" },
            { offset: 1, color: "#86efac" }
          ]),
          borderRadius: [4, 4, 0, 0]
        },
        barMaxWidth: 24
      },
      {
        name: "销售金额",
        type: "bar",
        data: salesData,
        itemStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: "#3b82f6" },
            { offset: 1, color: "#93c5fd" }
          ]),
          borderRadius: [4, 4, 0, 0]
        },
        barMaxWidth: 24
      }
    ]
  };

  chartInstance.setOption(option);
};

const handleResize = () => {
  chartInstance?.resize();
};

const switchDays = (days: number) => {
  if (selectedDays.value !== days) {
    selectedDays.value = days;
    loadData();
  }
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

// 暴露刷新方法
defineExpose({ refresh: loadData });
</script>

<template>
  <el-card v-loading="loading" class="mb-4 chart-card">
    <template #header>
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-3">
          <span class="font-bold text-lg">采购与销售情况</span>
          <div class="summary-tags">
            <el-tag type="success" effect="plain" class="mr-2">
              采购: ¥{{ formatAmount(totalPurchase) }}
            </el-tag>
            <el-tag type="primary" effect="plain">
              销售: ¥{{ formatAmount(totalSales) }}
            </el-tag>
          </div>
        </div>
        <el-button-group>
          <el-button
            :type="selectedDays === 7 ? 'primary' : 'default'"
            size="small"
            @click="switchDays(7)"
          >
            近7天
          </el-button>
          <el-button
            :type="selectedDays === 30 ? 'primary' : 'default'"
            size="small"
            @click="switchDays(30)"
          >
            近30天
          </el-button>
        </el-button-group>
      </div>
    </template>
    <div ref="chartRef" class="chart-container" />
  </el-card>
</template>

<style lang="scss" scoped>
.chart-card {
  border-radius: 12px;

  :deep(.el-card__header) {
    padding: 16px 20px;
    border-bottom: 1px solid #f3f4f6;
  }

  :deep(.el-card__body) {
    padding: 16px 20px;
  }
}

.chart-container {
  width: 100%;
  height: 320px;
}

.summary-tags {
  display: flex;
  align-items: center;

  .el-tag {
    font-size: 13px;
  }
}

@media (width <= 768px) {
  .summary-tags {
    display: none;
  }
}
</style>
