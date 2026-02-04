<script setup lang="ts">
import { ref, onMounted } from "vue";
import {
  getReturnRateApi,
  getClaimLossApi,
  getSlowMovingApi,
  getExpiryDistributionApi,
  getStockoutApi
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
const dateRange = ref<[Date, Date] | null>(null);

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

async function loadReturnRate() {
  loading.value = true;
  try {
    const params: Record<string, unknown> = {};
    if (dateRange.value) {
      params.startDate = dateRange.value[0].toISOString();
      params.endDate = dateRange.value[1].toISOString();
    }
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
    const params: Record<string, unknown> = {};
    if (dateRange.value) {
      params.startDate = dateRange.value[0].toISOString();
      params.endDate = dateRange.value[1].toISOString();
    }
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
  }
}

function formatMoney(value: number) {
  return Number(fenToYuan(value));
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
        <el-date-picker
          v-model="dateRange"
          type="daterange"
          range-separator="至"
          start-placeholder="开始日期"
          end-placeholder="结束日期"
          @change="handleTabChange(activeTab)"
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
