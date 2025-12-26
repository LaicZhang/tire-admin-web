<script setup lang="ts">
import { defineAsyncComponent, onMounted, ref } from "vue";
import AlertCards from "./components/AlertCards.vue";
import RankingTabs from "./components/RankingTabs.vue";

const SalesChart = defineAsyncComponent(
  () => import("./components/SalesChart.vue")
);
const InitDict = defineAsyncComponent(
  () => import("./components/initDict.vue")
);

const showSalesChart = ref(false);
const showInitDict = ref(false);

const runOnIdle = (fn: () => void, timeout = 1500) => {
  const requestIdleCallback = (
    window as Window & {
      requestIdleCallback?: (
        callback: () => void,
        options?: { timeout: number }
      ) => void;
    }
  ).requestIdleCallback;

  if (typeof requestIdleCallback === "function") {
    requestIdleCallback(fn, { timeout });
    return;
  }

  window.setTimeout(fn, Math.min(800, timeout));
};

defineOptions({
  name: "Welcome"
});

onMounted(() => {
  // 避免图表/ECharts 与首页核心请求抢占带宽/CPU
  runOnIdle(() => {
    showSalesChart.value = true;
    showInitDict.value = true;
  });
});
</script>

<template>
  <div class="welcome-container p-1">
    <!-- 预警卡片 -->
    <AlertCards />

    <!-- 采购销售图表 -->
    <SalesChart v-if="showSalesChart" />
    <el-card v-else class="mb-4" shadow="never">
      <div class="chart-skeleton" />
    </el-card>

    <!-- 排行榜 -->
    <RankingTabs />

    <!-- 初始化字典（隐藏组件） -->
    <InitDict v-if="showInitDict" />
  </div>
</template>

<style lang="scss" scoped>
.welcome-container {
  max-width: 1600px;
  margin: 0 auto;
}

.chart-skeleton {
  width: 100%;
  height: 320px;
  background: linear-gradient(90deg, #f3f4f6 25%, #e5e7eb 37%, #f3f4f6 63%);
  background-size: 400% 100%;
  border-radius: 8px;
  animation: skeleton-loading 1.4s ease infinite;
}

@keyframes skeleton-loading {
  0% {
    background-position: 100% 50%;
  }

  100% {
    background-position: 0 50%;
  }
}
</style>
