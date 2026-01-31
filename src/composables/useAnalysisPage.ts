/**
 * 分析页面 Composable
 * 封装分析页面的通用逻辑：日期筛选、刷新、ECharts 初始化、resize 处理
 */

import { ref, onMounted, onUnmounted, nextTick } from "vue";
import { createLogger } from "@/utils/logger";
import type { Ref } from "vue";

export interface DateRangeValue {
  startDate: string;
  endDate: string;
}

export interface AnalysisPageOptions {
  /** ECharts 图表容器引用 */
  chartRef: Ref<HTMLElement | null>;
  /** ECharts 实例名（用于获取 echarts） */
  chartName?: string;
  /** 日期范围默认值 */
  defaultDateRange?: () => [Date, Date];
  /** 刷新回调 */
  onRefresh: (dateRange?: DateRangeValue) => Promise<void>;
}

export interface UseAnalysisPageReturn {
  /** 日期范围 */
  dateRange: Ref<[Date, Date] | null>;
  /** 加载状态 */
  loading: Ref<boolean>;
  /** 图表实例 */
  chartInstance: Ref<unknown>;
  /** 刷新数据 */
  refresh: () => Promise<void>;
  /** 重置并刷新 */
  resetAndRefresh: () => void;
  /** 导出图表图片 */
  exportChartImage: (filename?: string) => void;
  /** 日期快捷选项 */
  shortcuts: Array<{ text: string; value: () => [Date, Date] }>;
}

export function useAnalysisPage(
  options: AnalysisPageOptions
): UseAnalysisPageReturn {
  const {
    chartRef,
    chartName = "echarts",
    onRefresh,
    defaultDateRange
  } = options;

  const dateRange = ref<[Date, Date] | null>(defaultDateRange?.() || null);
  const loading = ref(false);
  const chartInstance = ref<unknown>(null);

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

  function handleResize() {
    if (
      chartInstance.value &&
      typeof (chartInstance.value as { resize: () => void }).resize ===
        "function"
    ) {
      (chartInstance.value as { resize: () => void }).resize();
    }
  }

  async function initChart() {
    if (!chartRef.value) return;

    try {
      const echarts = await import(/* webpackChunkName: chartName */ chartName);
      if (chartInstance.value) {
        (chartInstance.value as { dispose: () => void }).dispose();
      }
      chartInstance.value = echarts.init(chartRef.value);
      window.addEventListener("resize", handleResize);
    } catch {
      createLogger("useAnalysisPage").error("Failed to initialize chart");
    }
  }

  async function refresh() {
    loading.value = true;
    try {
      let dateRangeValue: DateRangeValue | undefined;
      if (dateRange.value && dateRange.value.length === 2) {
        const formatDate = (d: Date) =>
          `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
        dateRangeValue = {
          startDate: formatDate(dateRange.value[0]),
          endDate: formatDate(dateRange.value[1])
        };
      }
      await onRefresh(dateRangeValue);
    } finally {
      loading.value = false;
    }
  }

  function resetAndRefresh() {
    dateRange.value = defaultDateRange?.() || null;
    refresh();
  }

  function exportChartImage(filename = "chart") {
    if (
      chartInstance.value &&
      typeof (
        chartInstance.value as { getDataURL: (options: unknown) => string }
      ).getDataURL === "function"
    ) {
      const dataURL = (
        chartInstance.value as { getDataURL: (options: unknown) => string }
      ).getDataURL({
        type: "png",
        pixelRatio: 2,
        backgroundColor: "#fff"
      });
      const link = document.createElement("a");
      link.download = `${filename}_${Date.now()}.png`;
      link.href = dataURL;
      link.click();
    }
  }

  onMounted(() => {
    nextTick(() => {
      initChart();
      refresh();
    });
  });

  onUnmounted(() => {
    window.removeEventListener("resize", handleResize);
    if (
      chartInstance.value &&
      typeof (chartInstance.value as { dispose: () => void }).dispose ===
        "function"
    ) {
      (chartInstance.value as { dispose: () => void }).dispose();
    }
  });

  return {
    dateRange,
    loading,
    chartInstance,
    refresh,
    resetAndRefresh,
    exportChartImage,
    shortcuts: shortcuts as Array<{ text: string; value: () => [Date, Date] }>
  };
}

/**
 * 汇总卡片数据
 */
export function useSummaryCard() {
  const summaryData = ref<
    Array<{
      label: string;
      value: string | number;
      type?: "success" | "warning" | "danger" | "info";
    }>
  >([]);

  function setSummaryData(
    data: Array<{
      label: string;
      value: string | number;
      type?: "success" | "warning" | "danger" | "info";
    }>
  ) {
    summaryData.value = data;
  }

  function addSummaryItem(item: {
    label: string;
    value: string | number;
    type?: "success" | "warning" | "danger" | "info";
  }) {
    summaryData.value.push(item);
  }

  function clearSummary() {
    summaryData.value = [];
  }

  return {
    summaryData,
    setSummaryData,
    addSummaryItem,
    clearSummary
  };
}
