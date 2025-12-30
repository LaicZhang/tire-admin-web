<script setup lang="ts">
import { ref, onMounted } from "vue";
import { getPurchaseSalesApi } from "@/api";
import type { RankingItem } from "@/api/dashboard";
import { message } from "@/utils";
import { useColumns } from "./columns";

defineOptions({
  name: "RankingTabs"
});

const {
  salesProductsColumns,
  purchaseProductsColumns,
  providersColumns,
  customersColumns
} = useColumns();

const loading = ref(false);
const activeTab = ref("salesProducts");

// 排行榜数据
const topSalesProducts = ref<RankingItem[]>([]);
const topPurchaseProducts = ref<RankingItem[]>([]);
const topProviders = ref<RankingItem[]>([]);
const topCustomers = ref<RankingItem[]>([]);

// 获取排名徽章样式
const getRankBadgeClass = (rank: number) => {
  if (rank === 1) return "rank-badge--gold";
  if (rank === 2) return "rank-badge--silver";
  if (rank === 3) return "rank-badge--bronze";
  return "";
};

const loadData = async () => {
  loading.value = true;
  try {
    const { code, data, msg } = await getPurchaseSalesApi(30);
    if (code === 200 && data) {
      topSalesProducts.value = data.topSalesProducts || [];
      topPurchaseProducts.value = data.topPurchaseProducts || [];
      topProviders.value = data.topProviders || [];
      topCustomers.value = data.topCustomers || [];
    } else if (msg) {
      message(msg, { type: "warning" });
    }
  } catch (error) {
    console.error("获取排行榜数据失败:", error);
  } finally {
    loading.value = false;
  }
};

onMounted(() => {
  loadData();
});

// 暴露刷新方法
defineExpose({ refresh: loadData });
</script>

<template>
  <el-card v-loading="loading" class="ranking-card">
    <template #header>
      <span class="font-bold text-lg">排行榜 (近30天)</span>
    </template>
    <el-tabs v-model="activeTab" class="ranking-tabs">
      <!-- 销售 Top10 商品 -->
      <el-tab-pane label="销售商品 Top10" name="salesProducts">
        <pure-table
          stripe
          max-height="340"
          :data="topSalesProducts"
          :columns="salesProductsColumns"
        >
          <template #rank="{ row }">
            <span class="rank-badge" :class="getRankBadgeClass(row.rank)">
              {{ row.rank }}
            </span>
          </template>
          <template #empty>
            <el-empty description="暂无数据" />
          </template>
        </pure-table>
      </el-tab-pane>

      <!-- 采购 Top10 商品 -->
      <el-tab-pane label="采购商品 Top10" name="purchaseProducts">
        <pure-table
          stripe
          max-height="340"
          :data="topPurchaseProducts"
          :columns="purchaseProductsColumns"
        >
          <template #rank="{ row }">
            <span class="rank-badge" :class="getRankBadgeClass(row.rank)">
              {{ row.rank }}
            </span>
          </template>
          <template #empty>
            <el-empty description="暂无数据" />
          </template>
        </pure-table>
      </el-tab-pane>

      <!-- Top10 供应商 -->
      <el-tab-pane label="供应商 Top10" name="providers">
        <pure-table
          stripe
          max-height="340"
          :data="topProviders"
          :columns="providersColumns"
        >
          <template #rank="{ row }">
            <span class="rank-badge" :class="getRankBadgeClass(row.rank)">
              {{ row.rank }}
            </span>
          </template>
          <template #empty>
            <el-empty description="暂无数据" />
          </template>
        </pure-table>
      </el-tab-pane>

      <!-- Top10 客户 -->
      <el-tab-pane label="客户 Top10" name="customers">
        <pure-table
          stripe
          max-height="340"
          :data="topCustomers"
          :columns="customersColumns"
        >
          <template #rank="{ row }">
            <span class="rank-badge" :class="getRankBadgeClass(row.rank)">
              {{ row.rank }}
            </span>
          </template>
          <template #empty>
            <el-empty description="暂无数据" />
          </template>
        </pure-table>
      </el-tab-pane>
    </el-tabs>
  </el-card>
</template>

<style lang="scss" scoped>
.ranking-card {
  border-radius: 12px;

  :deep(.el-card__header) {
    padding: 16px 20px;
    border-bottom: 1px solid #f3f4f6;
  }

  :deep(.el-card__body) {
    padding: 0 20px 20px;
  }
}

.ranking-tabs {
  :deep(.el-tabs__header) {
    margin-bottom: 0;
  }

  :deep(.el-tabs__nav-wrap::after) {
    display: none;
  }

  :deep(.el-tabs__item) {
    padding: 0 16px;
    font-size: 13px;
  }
}

.rank-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  font-size: 12px;
  font-weight: 600;
  color: #6b7280;
  background: #f3f4f6;
  border-radius: 50%;

  &--gold {
    color: white;
    background: linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%);
    box-shadow: 0 2px 4px rgb(245 158 11 / 30%);
  }

  &--silver {
    color: white;
    background: linear-gradient(135deg, #9ca3af 0%, #6b7280 100%);
    box-shadow: 0 2px 4px rgb(107 114 128 / 30%);
  }

  &--bronze {
    color: white;
    background: linear-gradient(135deg, #d97706 0%, #b45309 100%);
    box-shadow: 0 2px 4px rgb(180 83 9 / 30%);
  }
}

:deep(.el-table) {
  --el-table-border-color: #f3f4f6;

  .el-table__header th {
    font-weight: 500;
    color: #6b7280;
    background: #f9fafb;
  }
}
</style>
