<script setup lang="ts">
import { ref, onMounted, computed } from "vue";
import {
  getCustomerRankingApi,
  getProviderRankingApi,
  getProductRankingApi,
  getOperatorRankingApi
} from "@/api/analysis";
import { message } from "@/utils/message";
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
const limit = ref(20); // 默认展示 Top 20

const limitOptions = [
  { label: "Top 10", value: 10 },
  { label: "Top 20", value: 20 },
  { label: "Top 50", value: 50 },
  { label: "Top 100", value: 100 }
];

// 日期范围筛选
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
// 排行榜数据
const customerRanking = ref<unknown[]>([]);
const providerRanking = ref<unknown[]>([]);
const productRanking = ref<unknown[]>([]);
const operatorRanking = ref<unknown[]>([]);

const dateParams = computed(() => toRequiredDateParams(dateRange.value));

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
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "加载排行榜数据失败";
    message(msg, { type: "error" });
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

    <!-- 排行榜 Tabs -->
    <el-card>
      <el-tabs v-model="activeTab">
        <!-- 客户排行 -->
        <el-tab-pane label="客户业绩排行" name="customer">
          <pure-table
            border
            stripe
            :loading="loading"
            :data="customerRanking"
            :columns="customerColumns"
          />
        </el-tab-pane>

        <!-- 供应商排行 -->
        <el-tab-pane label="供应商采购排行" name="provider">
          <pure-table
            border
            stripe
            :loading="loading"
            :data="providerRanking"
            :columns="providerColumns"
          />
        </el-tab-pane>

        <!-- 商品排行 -->
        <el-tab-pane label="热门商品排行" name="product">
          <pure-table
            border
            stripe
            :loading="loading"
            :data="productRanking"
            :columns="productColumns"
          />
        </el-tab-pane>

        <!-- 员工排行 -->
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
