<script setup lang="ts">
import { ref, onMounted, computed, nextTick } from "vue";
import { getReceivableAgingApi, getPayableAgingApi } from "@/api/analysis";
import { message } from "@/utils/message";
import { useRenderIcon } from "@/components/ReIcon/src/hooks";
import Refresh from "~icons/ep/refresh";
import * as echarts from "echarts";

defineOptions({
  name: "AnalysisAging"
});

const loading = ref(false);
const activeTab = ref("receivable");
const dateRange = ref<[Date, Date] | null>(null);

// 应收数据
const receivableData = ref({
  totalAmount: "0",
  buckets: [],
  details: []
});
// 应付数据
const payableData = ref({
  totalAmount: "0",
  buckets: [],
  details: []
});

const chartRefReceivable = ref<HTMLElement | null>(null);
const chartRefPayable = ref<HTMLElement | null>(null);
let chartInstanceReceivable: echarts.ECharts | null = null;
let chartInstancePayable: echarts.ECharts | null = null;

const dateParams = computed(() => {
  // 账龄分析通常不需要时间段筛选，而是截止日期，但API提供了startDate/endDate，可能是筛选订单生成时间
  // 这里暂时不传，获取所有未结清
  return {};
});

const formatAmount = (val: string | number) => {
  const num = Number(val) / 100;
  return num.toLocaleString("zh-CN", { minimumFractionDigits: 2 });
};

const getReceivable = async () => {
  try {
    const { data, code } = await getReceivableAgingApi(dateParams.value);
    if (code === 200 && data) {
      receivableData.value = {
        totalAmount: data.totalAmount || "0",
        buckets: data.buckets || [],
        details: data.details || []
      };
      nextTick(() => updateChart("receivable"));
    }
  } catch (error) {
    console.error("获取应收账龄失败", error);
  }
};

const getPayable = async () => {
  try {
    const { data, code } = await getPayableAgingApi(dateParams.value);
    if (code === 200 && data) {
      payableData.value = {
        totalAmount: data.totalAmount || "0",
        buckets: data.buckets || [],
        details: data.details || []
      };
      nextTick(() => updateChart("payable"));
    }
  } catch (error) {
    console.error("获取应付账龄失败", error);
  }
};

const updateChart = (type: "receivable" | "payable") => {
  const isReceivable = type === "receivable";
  const refDom = isReceivable
    ? chartRefReceivable.value
    : chartRefPayable.value;
  const buckets = isReceivable
    ? receivableData.value.buckets
    : payableData.value.buckets;

  if (!refDom || !buckets.length) return;

  let instance = isReceivable ? chartInstanceReceivable : chartInstancePayable;
  if (!instance) {
    instance = echarts.init(refDom);
    if (isReceivable) chartInstanceReceivable = instance;
    else chartInstancePayable = instance;
  }

  const option = {
    title: {
      text: "账龄分布(金额)",
      left: "center"
    },
    tooltip: {
      trigger: "item",
      formatter: "{b}: {c} ({d}%)"
    },
    legend: {
      orient: "vertical",
      left: "left"
    },
    series: [
      {
        name: "金额",
        type: "pie",
        radius: "50%",
        data: buckets.map((item: any) => ({
          value: Number(item.amount) / 100, // 转为元
          name: item.label
        })),
        emphasis: {
          itemStyle: {
            shadowBlur: 10,
            shadowOffsetX: 0,
            shadowColor: "rgba(0, 0, 0, 0.5)"
          }
        }
      }
    ]
  };

  instance.setOption(option);
};

const loadData = async () => {
  loading.value = true;
  try {
    await Promise.all([getReceivable(), getPayable()]);
  } catch (error) {
    message("加载账龄数据失败", { type: "error" });
  } finally {
    loading.value = false;
  }
};

const handleTabChange = () => {
  nextTick(() => {
    if (activeTab.value === "receivable") {
      chartInstanceReceivable?.resize();
      updateChart("receivable");
    } else {
      chartInstancePayable?.resize();
      updateChart("payable");
    }
  });
};

onMounted(() => {
  loadData();
  window.addEventListener("resize", () => {
    chartInstanceReceivable?.resize();
    chartInstancePayable?.resize();
  });
});
</script>

<template>
  <div class="main p-4">
    <el-card class="mb-4">
      <div class="flex items-center justify-between">
        <span class="font-bold text-lg">账龄分析</span>
        <el-button :icon="useRenderIcon(Refresh)" circle @click="loadData" />
      </div>
    </el-card>

    <el-card v-loading="loading">
      <el-tabs v-model="activeTab" @tab-change="handleTabChange">
        <el-tab-pane label="应收账款分析 (客户欠款)" name="receivable">
          <el-row :gutter="20">
            <el-col :span="10">
              <div ref="chartRefReceivable" class="h-80 w-full" />
              <div class="text-center mt-4">
                <span class="text-gray-500">总应收金额: </span>
                <span class="text-xl font-bold text-red-500"
                  >¥{{ formatAmount(receivableData.totalAmount) }}</span
                >
              </div>
            </el-col>
            <el-col :span="14">
              <el-table
                :data="receivableData.details"
                height="400"
                stripe
                border
              >
                <el-table-column prop="name" label="客户名称" />
                <el-table-column
                  prop="orderNumber"
                  label="关联订单号"
                  width="180"
                />
                <el-table-column
                  prop="orderDate"
                  label="订单日期"
                  width="120"
                />
                <el-table-column prop="dueAmount" label="欠款金额">
                  <template #default="{ row }">
                    <span class="font-bold text-red-500"
                      >¥{{ formatAmount(row.dueAmount) }}</span
                    >
                  </template>
                </el-table-column>
                <el-table-column
                  prop="agingDays"
                  label="账龄(天)"
                  width="100"
                  sortable
                />
                <el-table-column
                  prop="agingBucket"
                  label="账龄区间"
                  width="120"
                />
              </el-table>
            </el-col>
          </el-row>
        </el-tab-pane>

        <el-tab-pane label="应付账款分析 (欠供应商)" name="payable">
          <el-row :gutter="20">
            <el-col :span="10">
              <div ref="chartRefPayable" class="h-80 w-full" />
              <div class="text-center mt-4">
                <span class="text-gray-500">总应付金额: </span>
                <span class="text-xl font-bold text-green-500"
                  >¥{{ formatAmount(payableData.totalAmount) }}</span
                >
              </div>
            </el-col>
            <el-col :span="14">
              <el-table :data="payableData.details" height="400" stripe border>
                <el-table-column prop="name" label="供应商名称" />
                <el-table-column
                  prop="orderNumber"
                  label="关联订单号"
                  width="180"
                />
                <el-table-column
                  prop="orderDate"
                  label="订单日期"
                  width="120"
                />
                <el-table-column prop="dueAmount" label="欠款金额">
                  <template #default="{ row }">
                    <span class="font-bold text-green-500"
                      >¥{{ formatAmount(row.dueAmount) }}</span
                    >
                  </template>
                </el-table-column>
                <el-table-column
                  prop="agingDays"
                  label="账龄(天)"
                  width="100"
                  sortable
                />
                <el-table-column
                  prop="agingBucket"
                  label="账龄区间"
                  width="120"
                />
              </el-table>
            </el-col>
          </el-row>
        </el-tab-pane>
      </el-tabs>
    </el-card>
  </div>
</template>
