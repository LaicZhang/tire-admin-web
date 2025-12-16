<script setup lang="ts">
import { ref, onMounted } from "vue";
import {
  getInventorySummaryApi,
  getSlowMovingApi,
  getStockoutApi
} from "@/api/analysis";
import { message } from "@/utils/message";
import { useRenderIcon } from "@/components/ReIcon/src/hooks";
import Refresh from "~icons/ep/refresh";

defineOptions({
  name: "AnalysisInventory"
});

const loading = ref(false);

// 库存汇总数据
const summaryData = ref({
  totalCount: 0,
  toBeStockedCount: 0,
  toBeShippedCount: 0,
  inTransitCount: 0,
  totalValue: "0",
  skuCount: 0,
  repoCount: 0,
  belowAlarmCount: 0
});

// 滞销商品
const slowMovingList = ref<any[]>([]);
// 缺货分析
const stockoutList = ref<any[]>([]);

// 格式化金额
const formatAmount = (val: string | number) => {
  const num = Number(val) / 100;
  return num.toLocaleString("zh-CN", { minimumFractionDigits: 2 });
};

const getSummary = async () => {
  try {
    const { data, code } = await getInventorySummaryApi();
    if (code === 200 && data) {
      summaryData.value = {
        totalCount: data.totalCount || 0,
        toBeStockedCount: data.toBeStockedCount || 0,
        toBeShippedCount: data.toBeShippedCount || 0,
        inTransitCount: data.inTransitCount || 0,
        totalValue: data.totalValue || "0",
        skuCount: data.skuCount || 0,
        repoCount: data.repoCount || 0,
        belowAlarmCount: data.belowAlarmCount || 0
      };
    }
  } catch (error) {
    console.error("获取库存汇总失败:", error);
  }
};

const getSlowMoving = async () => {
  try {
    const { data, code } = await getSlowMovingApi({ days: 90 }); // 默认90天滞销
    if (code === 200) {
      slowMovingList.value = Array.isArray(data) ? data : data.items || [];
    }
  } catch (error) {
    console.error("获取滞销数据失败:", error);
  }
};

const getStockout = async () => {
  try {
    const { data, code } = await getStockoutApi();
    if (code === 200) {
      stockoutList.value = Array.isArray(data) ? data : data.items || [];
    }
  } catch (error) {
    console.error("获取缺货数据失败:", error);
  }
};

const loadData = async () => {
  loading.value = true;
  try {
    await Promise.all([getSummary(), getSlowMoving(), getStockout()]);
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "加载数据失败";
    message(msg, { type: "error" });
  } finally {
    loading.value = false;
  }
};

onMounted(() => {
  loadData();
});
</script>

<template>
  <div class="main p-4">
    <!-- 顶部操作栏 -->
    <el-card class="mb-4">
      <div class="flex items-center justify-between">
        <span class="font-bold text-lg">库存数据总览</span>
        <el-button :icon="useRenderIcon(Refresh)" circle @click="loadData" />
      </div>
    </el-card>

    <!-- 汇总卡片 -->
    <el-row :gutter="16" class="mb-4">
      <el-col :span="6">
        <el-card shadow="hover" class="text-center">
          <div class="text-gray-500 text-sm">库存总价值</div>
          <div class="text-xl font-bold text-blue-500 mt-2">
            ¥{{ formatAmount(summaryData.totalValue) }}
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover" class="text-center">
          <div class="text-gray-500 text-sm">库存商品总数</div>
          <div class="text-xl font-bold text-green-500 mt-2">
            {{ summaryData.totalCount }}
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover" class="text-center">
          <div class="text-gray-500 text-sm">待入库/待发货</div>
          <div class="text-xl font-bold text-orange-500 mt-2">
            {{ summaryData.toBeStockedCount }} /
            {{ summaryData.toBeShippedCount }}
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover" class="text-center">
          <div class="text-gray-500 text-sm">库存预警商品数</div>
          <div class="text-xl font-bold text-red-500 mt-2">
            {{ summaryData.belowAlarmCount }}
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 分析表格 -->
    <el-row :gutter="16">
      <el-col :span="12">
        <el-card>
          <template #header>
            <div class="flex justify-between items-center">
              <span class="font-bold">滞销商品 (90天未动)</span>
            </div>
          </template>
          <el-table :data="slowMovingList" stripe height="400">
            <el-table-column prop="tireName" label="商品名称" />
            <el-table-column prop="repoName" label="所在仓库" />
            <el-table-column prop="quantity" label="库存数量" width="100" />
            <el-table-column prop="lastMoveDate" label="最后异动时间" />
          </el-table>
        </el-card>
      </el-col>
      <el-col :span="12">
        <el-card>
          <template #header>
            <div class="flex justify-between items-center">
              <span class="font-bold">缺货预警</span>
            </div>
          </template>
          <el-table :data="stockoutList" stripe height="400">
            <el-table-column prop="tireName" label="商品名称" />
            <el-table-column
              prop="currentQuantity"
              label="当前库存"
              width="100"
            >
              <template #default="{ row }">
                <span class="text-red-500 font-bold">{{
                  row.currentQuantity
                }}</span>
              </template>
            </el-table-column>
            <el-table-column prop="safetyStock" label="安全库存" width="100" />
            <el-table-column prop="suggestPurchase" label="建议采购" />
          </el-table>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>
