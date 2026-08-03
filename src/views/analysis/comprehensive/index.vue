<script setup lang="ts">
import AnalysisDateToolbar from "../components/AnalysisDateToolbar.vue";
import {
  createDefaultAnalysisFilterState,
  inferGroupBy,
  toRequiredDateParams,
  type AnalysisGroupBy
} from "../shared";
import { computed, ref, onMounted } from "vue";
import {
  getReturnRateApi,
  getClaimLossApi,
  getSlowMovingApi,
  getExpiryDistributionApi,
  getStockoutApi,
  getProviderQualityIssuesApi
} from "@/api/analysis";
import { message } from "@/utils/message";
import { fenToYuan } from "@/utils/formatMoney";
import { useColumns } from "./columns";

defineOptions({
  name: "ComprehensiveAnalysis"
});

const { claimLossColumns, slowMovingColumns, expiryColumns, stockoutColumns } =
  useColumns();

const activeTab = ref("return-rate");
const loading = ref(false);
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

// 退货率数据
const returnRateData = ref({
  rate: 0,
  totalOrders: 0,
  returnOrders: 0,
  trend: [] as { date: string; rate: number }[]
});

// 理赔损失数据
const claimLossData = ref({
  totalLoss: 0,
  claimCount: 0,
  avgLoss: 0,
  byReason: [] as { reason: string; amount: number; count: number }[]
});

// 滞销商品数据
const slowMovingData = ref({
  list: [] as {
    name: string;
    stock: number;
    lastSaleDate: string;
    daysWithoutSale: number;
  }[]
});

// 临期分布数据
const expiryData = ref({
  list: [] as { range: string; count: number; percentage: number }[]
});

// 缺货数据
const stockoutData = ref({
  list: [] as { name: string; currentStock: number; minStock: number }[]
});

const providerQuality = ref({
  totalIssues: 0,
  totalLoss: "0",
  items: [] as Array<{
    providerId: string;
    providerName: string;
    totalIssues: number;
    totalLoss: string;
    claimOrderCount: number;
    avgResponsibilityRatio: number;
  }>
});

async function loadReturnRate() {
  loading.value = true;
  try {
    const params: Record<string, unknown> = {
      ...toRequiredDateParams(dateRange.value)
    };
    const { data, code, msg } = await getReturnRateApi(params);
    if (code === 200) {
      returnRateData.value = data || {
        rate: 0,
        totalOrders: 0,
        returnOrders: 0,
        trend: []
      };
    } else {
      message(msg || "加载失败", { type: "error" });
    }
  } catch {
    message("加载退货率数据失败", { type: "error" });
  } finally {
    loading.value = false;
  }
}

async function loadClaimLoss() {
  loading.value = true;
  try {
    const params: Record<string, unknown> = {
      ...toRequiredDateParams(dateRange.value)
    };
    const { data, code, msg } = await getClaimLossApi(params);
    if (code === 200) {
      claimLossData.value = data || {
        totalLoss: 0,
        claimCount: 0,
        avgLoss: 0,
        byReason: []
      };
    } else {
      message(msg || "加载失败", { type: "error" });
    }
  } catch {
    message("加载理赔损失数据失败", { type: "error" });
  } finally {
    loading.value = false;
  }
}

async function loadSlowMoving() {
  loading.value = true;
  try {
    const { data, code, msg } = await getSlowMovingApi({});
    if (code === 200) {
      const list = data?.list ?? data?.items ?? [];
      slowMovingData.value = {
        list: list.map(item => {
          const lastSaleTime = Date.parse(item.lastSaleDate);
          const daysWithoutSale = Number.isFinite(lastSaleTime)
            ? Math.max(
                0,
                Math.floor((Date.now() - lastSaleTime) / (1000 * 60 * 60 * 24))
              )
            : 0;

          return {
            name: item.tireName,
            stock: item.stockQuantity,
            lastSaleDate: item.lastSaleDate,
            daysWithoutSale
          };
        })
      };
    } else {
      message(msg || "加载失败", { type: "error" });
    }
  } catch {
    message("加载滞销商品数据失败", { type: "error" });
  } finally {
    loading.value = false;
  }
}

async function loadExpiryDistribution() {
  loading.value = true;
  try {
    const { data, code, msg } = await getExpiryDistributionApi({});
    if (code === 200) {
      expiryData.value = { list: data?.list || [] };
    } else {
      message(msg || "加载失败", { type: "error" });
    }
  } catch {
    message("加载临期分布数据失败", { type: "error" });
  } finally {
    loading.value = false;
  }
}

async function loadStockout() {
  loading.value = true;
  try {
    const { data, code, msg } = await getStockoutApi();
    if (code === 200) {
      stockoutData.value = { list: data?.list || [] };
    } else {
      message(msg || "加载失败", { type: "error" });
    }
  } catch {
    message("加载缺货数据失败", { type: "error" });
  } finally {
    loading.value = false;
  }
}

async function loadProviderQuality() {
  loading.value = true;
  try {
    const params = { ...toRequiredDateParams(dateRange.value) };
    const { data, code, msg } = await getProviderQualityIssuesApi(params);
    if (code === 200 && data) {
      providerQuality.value = {
        totalIssues: data.totalIssues ?? 0,
        totalLoss: data.totalLoss ?? "0",
        items: (data.items ?? []).map(item => ({
          providerId: item.providerId,
          providerName: item.providerName,
          totalIssues: item.totalIssues,
          totalLoss: item.totalLoss,
          claimOrderCount: item.claimOrderCount ?? 0,
          avgResponsibilityRatio: item.avgResponsibilityRatio ?? 0
        }))
      };
    } else {
      message(msg || "加载失败", { type: "error" });
    }
  } catch {
    message("加载供应商质量问题失败", { type: "error" });
  } finally {
    loading.value = false;
  }
}

function handleTabChange(tab: string | number) {
  switch (String(tab)) {
    case "return-rate":
      loadReturnRate();
      break;
    case "claim-loss":
      loadClaimLoss();
      break;
    case "slow-moving":
      loadSlowMoving();
      break;
    case "expiry":
      loadExpiryDistribution();
      break;
    case "stockout":
      loadStockout();
      break;
    case "provider-quality":
      void loadProviderQuality();
      break;
  }
}

function formatMoney(value: number) {
  return Number(fenToYuan(value));
}

function loadData() {
  handleTabChange(activeTab.value);
}

function handleDateChange() {
  loadData();
}

onMounted(() => {
  loadReturnRate();
});
</script>

<template>
  <el-card>
    <template #header>
      <div class="flex items-center justify-between">
        <span class="text-lg font-medium">综合分析</span>
        <AnalysisDateToolbar
          v-model:date-range="dateRange"
          v-model:group-by="groupBy"
          :show-group-by="false"
          :loading="loading"
          @change="handleDateChange"
          @refresh="loadData"
        />
      </div>
    </template>

    <el-tabs v-model="activeTab" @tab-change="handleTabChange">
      <!-- 退货率分析 -->
      <el-tab-pane label="退货率分析" name="return-rate">
        <div v-loading="loading" class="min-h-[300px]">
          <el-row :gutter="20" class="mb-6">
            <el-col :span="8">
              <el-statistic title="退货率" :value="returnRateData.rate">
                <template #suffix>%</template>
              </el-statistic>
            </el-col>
            <el-col :span="8">
              <el-statistic
                title="总订单数"
                :value="returnRateData.totalOrders"
              />
            </el-col>
            <el-col :span="8">
              <el-statistic
                title="退货订单数"
                :value="returnRateData.returnOrders"
              />
            </el-col>
          </el-row>
          <el-empty
            v-if="!returnRateData.trend.length"
            description="暂无趋势数据"
          />
        </div>
      </el-tab-pane>

      <!-- 理赔损失分析 -->
      <el-tab-pane label="理赔损失" name="claim-loss">
        <div v-loading="loading" class="min-h-[300px]">
          <el-row :gutter="20" class="mb-6">
            <el-col :span="8">
              <el-statistic
                title="理赔总额"
                :value="formatMoney(claimLossData.totalLoss)"
              >
                <template #prefix>¥</template>
              </el-statistic>
            </el-col>
            <el-col :span="8">
              <el-statistic
                title="理赔次数"
                :value="claimLossData.claimCount"
              />
            </el-col>
            <el-col :span="8">
              <el-statistic
                title="平均理赔"
                :value="formatMoney(claimLossData.avgLoss)"
              >
                <template #prefix>¥</template>
              </el-statistic>
            </el-col>
          </el-row>
          <pure-table
            :data="claimLossData.byReason"
            :columns="claimLossColumns"
            border
          >
            <template #empty>
              <el-empty description="暂无理赔记录" />
            </template>
          </pure-table>
        </div>
      </el-tab-pane>

      <!-- 滞销商品分析 -->
      <el-tab-pane label="滞销商品" name="slow-moving">
        <div v-loading="loading" class="min-h-[300px]">
          <pure-table
            :data="slowMovingData.list"
            :columns="slowMovingColumns"
            border
          >
            <template #empty>
              <el-empty description="暂无滞销商品" />
            </template>
          </pure-table>
        </div>
      </el-tab-pane>

      <!-- 临期分布分析 -->
      <el-tab-pane label="临期分布" name="expiry">
        <div v-loading="loading" class="min-h-[300px]">
          <pure-table :data="expiryData.list" :columns="expiryColumns" border>
            <template #empty>
              <el-empty description="暂无临期数据" />
            </template>
          </pure-table>
        </div>
      </el-tab-pane>

      <!-- 缺货分析 -->
      <el-tab-pane label="供应商质量" name="provider-quality">
        <div v-loading="loading" class="space-y-4">
          <el-row :gutter="16">
            <el-col :span="8">
              <el-statistic title="质量问题数" :value="providerQuality.totalIssues" />
            </el-col>
            <el-col :span="8">
              <el-statistic
                title="总损失(元)"
                :value="formatMoney(Number(providerQuality.totalLoss || 0))"
              />
            </el-col>
            <el-col :span="8">
              <el-statistic
                title="涉及供应商"
                :value="providerQuality.items.length"
              />
            </el-col>
          </el-row>
          <el-table :data="providerQuality.items" stripe max-height="420">
            <el-table-column prop="providerName" label="供应商" min-width="140" />
            <el-table-column prop="totalIssues" label="问题数" width="100" />
            <el-table-column prop="claimOrderCount" label="理赔单" width="100" />
            <el-table-column label="损失(元)" min-width="120">
              <template #default="{ row }">
                {{ formatMoney(Number(row.totalLoss || 0)).toLocaleString() }}
              </template>
            </el-table-column>
            <el-table-column label="平均责任比" width="120">
              <template #default="{ row }">
                {{ row.avgResponsibilityRatio }}%
              </template>
            </el-table-column>
          </el-table>
        </div>
      </el-tab-pane>

      <el-tab-pane label="缺货分析" name="stockout">
        <div v-loading="loading" class="min-h-[300px]">
          <pure-table
            :data="stockoutData.list"
            :columns="stockoutColumns"
            border
          >
            <template #empty>
              <el-empty description="暂无缺货商品" />
            </template>
          </pure-table>
        </div>
      </el-tab-pane>
    </el-tabs>
  </el-card>
</template>
