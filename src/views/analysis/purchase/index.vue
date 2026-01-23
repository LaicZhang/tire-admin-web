<script setup lang="ts">
import { ref, onMounted, computed, h } from "vue";
import {
  getPurchaseSummaryApi,
  getProviderRankingApi,
  getProductRankingApi
} from "@/api/analysis";
import { message } from "@/utils/message";
import { useRenderIcon } from "@/components/ReIcon/src/hooks";
import { providerColumns, productColumns } from "./columns";
import Refresh from "~icons/ep/refresh";
import dayjs from "dayjs";

defineOptions({
  name: "AnalysisPurchase"
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

// 采购汇总数据
const summaryData = ref({
  totalAmount: "0",
  totalOrders: 0,
  paidAmount: "0",
  unpaidAmount: "0",
  averageOrderValue: "0",
  arrivalRate: 0
});

// 排行榜数据
const providerRanking = ref<unknown[]>([]);
const productRanking = ref<unknown[]>([]);

// 当前选中的排行榜类型
const activeRankingTab = ref("provider");

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
    const { data, code } = await getPurchaseSummaryApi(dateParams.value);
    if (code === 200 && data) {
      summaryData.value = {
        totalAmount: data.totalAmount || "0",
        totalOrders: data.totalOrders || 0,
        paidAmount: data.paidAmount || "0",
        unpaidAmount: data.unpaidAmount || "0",
        averageOrderValue: data.averageOrderValue || "0",
        arrivalRate: data.arrivalRate || 0
      };
    }
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "获取采购汇总失败";
    message(msg, { type: "error" });
  }
};

const getRankings = async () => {
  try {
    const [providerRes, productRes] = await Promise.all([
      getProviderRankingApi({ ...dateParams.value, limit: 10 }),
      getProductRankingApi({
        ...dateParams.value,
        limit: 10,
        orderBy: "amount"
      })
    ]);

    if (providerRes.code === 200) {
      providerRanking.value = providerRes.data?.items || [];
    }
    if (productRes.code === 200) {
      // 注意：这里复用商品排行接口，实际业务可能需要区分"采购商品排行"和"销售商品排行"
      // 如果后端接口没有区分参数，这里展示的可能是整体商品排行
      // 假设getProductRankingApi返回的是通用的或有参数区分但目前文档未体现
      productRanking.value = productRes.data?.items || [];
    }
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "获取排行榜失败";
    message(msg, { type: "error" });
  }
};

const loadData = async () => {
  loading.value = true;
  try {
    await Promise.all([getSummary(), getRankings()]);
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

onMounted(() => {
  loadData();
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
          <div class="text-gray-500 text-sm">采购总额</div>
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
          <div class="text-gray-500 text-sm">已付款</div>
          <div class="text-xl font-bold text-emerald-500 mt-2">
            ¥{{ formatAmount(summaryData.paidAmount) }}
          </div>
        </el-card>
      </el-col>
      <el-col :span="4">
        <el-card shadow="hover" class="text-center">
          <div class="text-gray-500 text-sm">未付款</div>
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
          <div class="text-gray-500 text-sm">到货完成率</div>
          <div class="text-xl font-bold text-cyan-500 mt-2">
            {{ summaryData.arrivalRate }}%
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 排行榜 -->
    <el-card>
      <template #header>
        <span class="font-bold">排行榜</span>
      </template>
      <el-tabs v-model="activeRankingTab">
        <el-tab-pane label="供应商排行" name="provider">
          <pure-table
            :data="providerRanking"
            :columns="providerColumns"
            stripe
            max-height="400"
          />
        </el-tab-pane>
        <el-tab-pane label="商品排行" name="product">
          <pure-table
            :data="productRanking"
            :columns="productColumns"
            stripe
            max-height="400"
          />
        </el-tab-pane>
      </el-tabs>
    </el-card>
  </div>
</template>
