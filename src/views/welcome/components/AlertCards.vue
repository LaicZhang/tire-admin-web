<script setup lang="ts">
import { ref, onMounted, computed } from "vue";
import { useRouter } from "vue-router";
import { getDashboardSummaryApi } from "@/api";
import { handleApiError, message } from "@/utils";
import { useRenderIcon } from "@/components/ReIcon/src/hooks";
import Warning from "~icons/ep/warning";
import Clock from "~icons/ep/clock";
import Van from "~icons/ep/van";
import Box from "~icons/ep/box";

defineOptions({
  name: "AlertCards"
});

const router = useRouter();
const loading = ref(false);

const summaryData = ref({
  stockAlertCount: 0,
  stockOverflowCount: 0,
  expiryAlertCount: 0,
  unshippedSalesCount: 0,
  unstockedPurchaseCount: 0
});

// 库存预警总数
const stockAlertTotal = computed(
  () => summaryData.value.stockAlertCount + summaryData.value.stockOverflowCount
);

const loadData = async () => {
  loading.value = true;
  try {
    const { code, data, msg } = await getDashboardSummaryApi();
    if (code === 200 && data) {
      summaryData.value = data;
    } else if (msg) {
      message(msg, { type: "warning" });
    }
  } catch (error) {
    handleApiError(error, "获取仪表盘汇总失败");
  } finally {
    loading.value = false;
  }
};

const navigateTo = (path: string) => {
  router.push(path);
};

onMounted(() => {
  loadData();
});

// 暴露刷新方法供父组件调用
defineExpose({ refresh: loadData });
</script>

<template>
  <el-row v-loading="loading" :gutter="16" class="mb-4">
    <!-- 库存预警 -->
    <el-col :xs="24" :sm="12" :md="6" class="mb-4 md:mb-0">
      <el-card
        shadow="hover"
        class="alert-card alert-card--stock cursor-pointer"
        @click="navigateTo('/business/stockAlert')"
      >
        <div class="alert-card__content">
          <div class="alert-card__icon alert-card__icon--warning">
            <component :is="useRenderIcon(Warning)" />
          </div>
          <div class="alert-card__info">
            <div class="alert-card__label">库存预警</div>
            <div class="alert-card__value">
              <span class="alert-card__count">{{ stockAlertTotal }}</span>
              <span class="alert-card__unit">件商品</span>
            </div>
            <div v-if="stockAlertTotal > 0" class="alert-card__detail">
              <el-tag size="small" type="danger" class="mr-1">
                低库存 {{ summaryData.stockAlertCount }}
              </el-tag>
              <el-tag size="small" type="warning">
                超库存 {{ summaryData.stockOverflowCount }}
              </el-tag>
            </div>
          </div>
        </div>
      </el-card>
    </el-col>

    <!-- 保质期预警 -->
    <el-col :xs="24" :sm="12" :md="6" class="mb-4 md:mb-0">
      <el-card
        shadow="hover"
        class="alert-card alert-card--expiry cursor-pointer"
        @click="navigateTo('/business/expiryAlert')"
      >
        <div class="alert-card__content">
          <div class="alert-card__icon alert-card__icon--danger">
            <component :is="useRenderIcon(Clock)" />
          </div>
          <div class="alert-card__info">
            <div class="alert-card__label">保质期预警</div>
            <div class="alert-card__value">
              <span class="alert-card__count">{{
                summaryData.expiryAlertCount
              }}</span>
              <span class="alert-card__unit">件商品</span>
            </div>
            <div
              v-if="summaryData.expiryAlertCount > 0"
              class="alert-card__detail"
            >
              <el-tag size="small" type="danger">需及时处理</el-tag>
            </div>
          </div>
        </div>
      </el-card>
    </el-col>

    <!-- 未出库销售 -->
    <el-col :xs="24" :sm="12" :md="6" class="mb-4 md:mb-0">
      <el-card
        shadow="hover"
        class="alert-card alert-card--sales cursor-pointer"
        @click="navigateTo('/business/order?type=sale')"
      >
        <div class="alert-card__content">
          <div class="alert-card__icon alert-card__icon--primary">
            <component :is="useRenderIcon(Van)" />
          </div>
          <div class="alert-card__info">
            <div class="alert-card__label">未出库销售</div>
            <div class="alert-card__value">
              <span class="alert-card__count">{{
                summaryData.unshippedSalesCount
              }}</span>
              <span class="alert-card__unit">个订单</span>
            </div>
            <div
              v-if="summaryData.unshippedSalesCount > 0"
              class="alert-card__detail"
            >
              <el-tag size="small" type="info">待生成出库单</el-tag>
            </div>
          </div>
        </div>
      </el-card>
    </el-col>

    <!-- 未入库采购 -->
    <el-col :xs="24" :sm="12" :md="6">
      <el-card
        shadow="hover"
        class="alert-card alert-card--purchase cursor-pointer"
        @click="navigateTo('/business/order?type=purchase')"
      >
        <div class="alert-card__content">
          <div class="alert-card__icon alert-card__icon--success">
            <component :is="useRenderIcon(Box)" />
          </div>
          <div class="alert-card__info">
            <div class="alert-card__label">未入库采购</div>
            <div class="alert-card__value">
              <span class="alert-card__count">{{
                summaryData.unstockedPurchaseCount
              }}</span>
              <span class="alert-card__unit">个订单</span>
            </div>
            <div
              v-if="summaryData.unstockedPurchaseCount > 0"
              class="alert-card__detail"
            >
              <el-tag size="small" type="success">待生成入库单</el-tag>
            </div>
          </div>
        </div>
      </el-card>
    </el-col>
  </el-row>
</template>

<style lang="scss" scoped>
.alert-card {
  overflow: hidden;
  border-radius: 12px;
  transition: all 0.3s ease;

  &:hover {
    box-shadow:
      0 12px 24px -10px rgb(0 0 0 / 15%),
      0 0 0 1px rgb(0 0 0 / 5%);
    transform: translateY(-4px);
  }

  :deep(.el-card__body) {
    padding: 20px;
  }

  &__content {
    display: flex;
    gap: 16px;
    align-items: center;
  }

  &__icon {
    display: flex;
    flex-shrink: 0;
    align-items: center;
    justify-content: center;
    width: 56px;
    height: 56px;
    font-size: 24px;
    border-radius: 12px;

    &--warning {
      color: #f97316;
      background: linear-gradient(135deg, #fef0e5 0%, #fff7ed 100%);
    }

    &--danger {
      color: #ef4444;
      background: linear-gradient(135deg, #fee2e2 0%, #fef2f2 100%);
    }

    &--primary {
      color: #3b82f6;
      background: linear-gradient(135deg, #dbeafe 0%, #eff6ff 100%);
    }

    &--success {
      color: #22c55e;
      background: linear-gradient(135deg, #dcfce7 0%, #f0fdf4 100%);
    }
  }

  &__info {
    flex: 1;
    min-width: 0;
  }

  &__label {
    margin-bottom: 4px;
    font-size: 14px;
    color: #6b7280;
  }

  &__value {
    display: flex;
    gap: 4px;
    align-items: baseline;
    margin-bottom: 6px;
  }

  &__count {
    font-size: 28px;
    font-weight: 600;
    line-height: 1;
    color: #1f2937;
  }

  &__unit {
    font-size: 13px;
    color: #9ca3af;
  }

  &__detail {
    display: flex;
    flex-wrap: wrap;
    gap: 4px;

    .el-tag {
      font-size: 11px;
    }
  }
}
</style>
