<script setup lang="ts">
import { computed, nextTick, onMounted, onUnmounted, ref, watch } from "vue";
import type { EChartsType } from "echarts/core";
import {
  getCustomerRankingApi,
  getProviderRankingApi,
  getProductRankingApi,
  getOperatorRankingApi
} from "@/api/analysis";
import { message } from "@/utils/message";
import { getEcharts } from "@/utils/echarts";
import AnalysisDateToolbar from "../components/AnalysisDateToolbar.vue";
import {
  createDefaultAnalysisFilterState,
  inferGroupBy,
  toRequiredDateParams,
  type AnalysisGroupBy
} from "../shared";
import { useColumns } from "./columns";

defineOptions({
  name: "AnalysisRanking"
});

const { customerColumns, providerColumns, productColumns, operatorColumns } =
  useColumns();

const loading = ref(false);
const activeTab = ref("customer");
const limit = ref(20);

const limitOptions = [
  { label: "Top 10", value: 10 },
  { label: "Top 20", value: 20 },
  { label: "Top 50", value: 50 },
  { label: "Top 100", value: 100 }
];

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

type RankItem = {
  rank?: number;
  name: string;
  amount: string;
  count?: number;
  quantity?: number;
};

const customerRanking = ref<RankItem[]>([]);
const providerRanking = ref<RankItem[]>([]);
const productRanking = ref<RankItem[]>([]);
const operatorRanking = ref<RankItem[]>([]);

const chartRef = ref<HTMLElement | null>(null);
let chartInstance: EChartsType | null = null;

const dateParams = computed(() => toRequiredDateParams(dateRange.value));

const activeRows = computed(() => {
  switch (activeTab.value) {
    case "provider":
      return providerRanking.value;
    case "product":
      return productRanking.value;
    case "operator":
      return operatorRanking.value;
    case "customer":
    default:
      return customerRanking.value;
  }
});

const activeSeriesName = computed(() => {
  switch (activeTab.value) {
    case "provider":
      return "采购金额";
    case "product":
      return "销售金额";
    case "operator":
      return "员工业绩";
    default:
      return "客户金额";
  }
});

function fenToYuan(val: string | number | null | undefined): number {
  const n = Number(String(val ?? "0").replace(/,/g, ""));
  return Number.isFinite(n) ? n / 100 : 0;
}

async function updateChart() {
  if (!chartRef.value) return;
  if (!chartInstance) {
    const echarts = await getEcharts();
    chartInstance = echarts.init(chartRef.value);
  }
  const rows = activeRows.value.slice(0, Math.min(limit.value, 20));
  const labels = rows.map(r => r.name || "-").reverse();
  const amounts = rows.map(r => fenToYuan(r.amount)).reverse();
  chartInstance.setOption(
    {
      tooltip: {
        trigger: "axis",
        axisPointer: { type: "shadow" },
        formatter: (params: unknown) => {
          const list = Array.isArray(params) ? params : [params];
          const item = list[0] as { name?: string; value?: number } | undefined;
          if (!item) return "";
          return `${item.name}<br/>${activeSeriesName.value}：¥${Number(
            item.value ?? 0
          ).toLocaleString("zh-CN", { minimumFractionDigits: 2 })}`;
        }
      },
      grid: {
        left: "3%",
        right: "8%",
        bottom: "3%",
        top: "8%",
        containLabel: true
      },
      xAxis: {
        type: "value",
        name: "金额(元)",
        axisLabel: {
          formatter: (val: number) =>
            val >= 10000 ? `${(val / 10000).toFixed(1)}万` : String(val)
        }
      },
      yAxis: {
        type: "category",
        data: labels,
        axisLabel: { width: 110, overflow: "truncate" }
      },
      series: [
        {
          name: activeSeriesName.value,
          type: "bar",
          data: amounts,
          itemStyle: { color: "#2563eb" }
        }
      ]
    },
    true
  );
}

const getCustomerRank = async () => {
  const { data, code } = await getCustomerRankingApi({
    ...dateParams.value,
    limit: limit.value
  });
  if (code === 200) customerRanking.value = data?.items || [];
};

const getProviderRank = async () => {
  const { data, code } = await getProviderRankingApi({
    ...dateParams.value,
    limit: limit.value
  });
  if (code === 200) providerRanking.value = data?.items || [];
};

const getProductRank = async () => {
  const { data, code } = await getProductRankingApi({
    ...dateParams.value,
    limit: limit.value,
    orderBy: "amount"
  });
  if (code === 200) productRanking.value = data?.items || [];
};

const getOperatorRank = async () => {
  const { data, code } = await getOperatorRankingApi({
    ...dateParams.value,
    limit: limit.value,
    orderBy: "amount"
  });
  if (code === 200) operatorRanking.value = data?.items || [];
};

const loadData = async () => {
  loading.value = true;
  try {
    await Promise.all([
      getCustomerRank(),
      getProviderRank(),
      getProductRank(),
      getOperatorRank()
    ]);
    await nextTick();
    await updateChart();
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "加载排行榜数据失败";
    message(msg, { type: "error" });
  } finally {
    loading.value = false;
  }
};

const handleFilterChange = () => {
  void loadData();
};

watch(activeTab, async () => {
  await nextTick();
  await updateChart();
});

const handleResize = () => {
  chartInstance?.resize();
};

onMounted(() => {
  void loadData();
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
      <div class="flex items-center space-x-4">
        <AnalysisDateToolbar
          v-model:date-range="dateRange"
          v-model:group-by="groupBy"
          :show-group-by="false"
          :loading="loading"
          @change="handleFilterChange"
          @refresh="loadData"
        />
        <el-select
          v-model="limit"
          placeholder="显示条数"
          class="w-32"
          @change="handleFilterChange"
        >
          <el-option
            v-for="item in limitOptions"
            :key="item.value"
            :label="item.label"
            :value="item.value"
          />
        </el-select>
        <div class="flex-grow" />
      </div>
    </el-card>

    <el-card class="mb-4">
      <template #header>
        <div class="flex items-center justify-between">
          <span class="font-bold">排行水平 bar（C/E1）</span>
          <el-tag size="small" type="info" effect="plain">当前 Tab Top</el-tag>
        </div>
      </template>
      <div ref="chartRef" v-loading="loading" class="h-80" />
    </el-card>

    <el-card>
      <el-tabs v-model="activeTab">
        <el-tab-pane label="客户业绩排行" name="customer">
          <pure-table
            border
            stripe
            :loading="loading"
            :data="customerRanking"
            :columns="customerColumns"
          />
        </el-tab-pane>

        <el-tab-pane label="供应商采购排行" name="provider">
          <pure-table
            border
            stripe
            :loading="loading"
            :data="providerRanking"
            :columns="providerColumns"
          />
        </el-tab-pane>

        <el-tab-pane label="热门商品排行" name="product">
          <pure-table
            border
            stripe
            :loading="loading"
            :data="productRanking"
            :columns="productColumns"
          />
        </el-tab-pane>

        <el-tab-pane label="员工业绩排行" name="operator">
          <pure-table
            border
            stripe
            :loading="loading"
            :data="operatorRanking"
            :columns="operatorColumns"
          />
        </el-tab-pane>
      </el-tabs>
    </el-card>
  </div>
</template>
