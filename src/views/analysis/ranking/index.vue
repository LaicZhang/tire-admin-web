<script setup lang="ts">
import { ref, onMounted, computed } from "vue";
import {
  getCustomerRankingApi,
  getProviderRankingApi,
  getProductRankingApi,
  getOperatorRankingApi
} from "@/api/analysis";
import { message } from "@/utils/message";
import { useRenderIcon } from "@/components/ReIcon/src/hooks";
import Refresh from "~icons/ep/refresh";
import dayjs from "dayjs";

defineOptions({
  name: "AnalysisRanking"
});

const loading = ref(false);
const activeTab = ref("customer");
const limit = ref(20); // 默认展示 Top 20

const limitOptions = [
  { label: "Top 10", value: 10 },
  { label: "Top 20", value: 20 },
  { label: "Top 50", value: 50 },
  { label: "Top 100", value: 100 }
];

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

// 排行榜数据
const customerRanking = ref<any[]>([]);
const providerRanking = ref<any[]>([]);
const productRanking = ref<any[]>([]);
const operatorRanking = ref<any[]>([]);

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
    orderBy: "amount" // 默认按金额排行
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
    // 根据当前Tab加载对应数据，或者一次性加载所有（如果为了切换流畅，可以一次性加载）
    // 为了用户体验，这里选择一次性加载，数据量不会太大（Top N）
    await Promise.all([
      getCustomerRank(),
      getProviderRank(),
      getProductRank(),
      getOperatorRank()
    ]);
  } catch (error) {
    message("加载排行榜数据失败", { type: "error" });
  } finally {
    loading.value = false;
  }
};

const handleFilterChange = () => {
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
      <div class="flex items-center space-x-4">
        <el-date-picker
          v-model="dateRange"
          type="daterange"
          range-separator="至"
          start-placeholder="开始日期"
          end-placeholder="结束日期"
          :shortcuts="shortcuts"
          @change="handleFilterChange"
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
        <el-button :icon="useRenderIcon(Refresh)" circle @click="loadData" />
      </div>
    </el-card>

    <!-- 排行榜 Tabs -->
    <el-card v-loading="loading">
      <el-tabs v-model="activeTab">
        <!-- 客户排行 -->
        <el-tab-pane label="客户业绩排行" name="customer">
          <el-table :data="customerRanking" stripe border>
            <el-table-column
              type="index"
              label="排名"
              width="80"
              align="center"
            >
              <template #default="{ $index }">
                <span
                  :class="{
                    'text-red-500 font-bold': $index < 3,
                    'text-gray-600': $index >= 3
                  }"
                  >{{ $index + 1 }}</span
                >
              </template>
            </el-table-column>
            <el-table-column prop="name" label="客户名称" />
            <el-table-column prop="count" label="订单数" width="120" sortable />
            <el-table-column prop="amount" label="交易总额" sortable>
              <template #default="{ row }">
                <span class="font-bold text-blue-600"
                  >¥{{ formatAmount(row.amount) }}</span
                >
              </template>
            </el-table-column>
          </el-table>
        </el-tab-pane>

        <!-- 供应商排行 -->
        <el-tab-pane label="供应商采购排行" name="provider">
          <el-table :data="providerRanking" stripe border>
            <el-table-column
              type="index"
              label="排名"
              width="80"
              align="center"
            >
              <template #default="{ $index }">
                <span
                  :class="{
                    'text-red-500 font-bold': $index < 3,
                    'text-gray-600': $index >= 3
                  }"
                  >{{ $index + 1 }}</span
                >
              </template>
            </el-table-column>
            <el-table-column prop="name" label="供应商名称" />
            <el-table-column prop="count" label="订单数" width="120" sortable />
            <el-table-column prop="amount" label="采购总额" sortable>
              <template #default="{ row }">
                <span class="font-bold text-green-600"
                  >¥{{ formatAmount(row.amount) }}</span
                >
              </template>
            </el-table-column>
          </el-table>
        </el-tab-pane>

        <!-- 商品排行 -->
        <el-tab-pane label="热门商品排行" name="product">
          <el-table :data="productRanking" stripe border>
            <el-table-column
              type="index"
              label="排名"
              width="80"
              align="center"
            >
              <template #default="{ $index }">
                <span
                  :class="{
                    'text-red-500 font-bold': $index < 3,
                    'text-gray-600': $index >= 3
                  }"
                  >{{ $index + 1 }}</span
                >
              </template>
            </el-table-column>
            <el-table-column prop="name" label="商品名称" />
            <el-table-column
              prop="quantity"
              label="交易量"
              width="120"
              sortable
            />
            <el-table-column prop="amount" label="交易总额" sortable>
              <template #default="{ row }">
                <span>¥{{ formatAmount(row.amount) }}</span>
              </template>
            </el-table-column>
            <el-table-column prop="profit" label="利润预估" sortable>
              <template #default="{ row }">
                <span class="text-emerald-500"
                  >¥{{ formatAmount(row.profit) }}</span
                >
              </template>
            </el-table-column>
          </el-table>
        </el-tab-pane>

        <!-- 员工排行 -->
        <el-tab-pane label="员工业绩排行" name="operator">
          <el-table :data="operatorRanking" stripe border>
            <el-table-column
              type="index"
              label="排名"
              width="80"
              align="center"
            >
              <template #default="{ $index }">
                <span
                  :class="{
                    'text-red-500 font-bold': $index < 3,
                    'text-gray-600': $index >= 3
                  }"
                  >{{ $index + 1 }}</span
                >
              </template>
            </el-table-column>
            <el-table-column prop="name" label="员工姓名" />
            <el-table-column
              prop="count"
              label="订单处理数"
              width="150"
              sortable
            />
            <el-table-column prop="amount" label="涉及金额" sortable>
              <template #default="{ row }">
                <span class="font-bold">¥{{ formatAmount(row.amount) }}</span>
              </template>
            </el-table-column>
          </el-table>
        </el-tab-pane>
      </el-tabs>
    </el-card>
  </div>
</template>
