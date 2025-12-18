<script setup lang="ts">
import AlertCards from "./components/AlertCards.vue";
import SalesChart from "./components/SalesChart.vue";
import RankingTabs from "./components/RankingTabs.vue";
import initDict from "./components/initDict.vue";

defineOptions({
  name: "Welcome"
});
</script>

<template>
  <div class="welcome-container p-1">
    <!-- 预警卡片 -->
    <AlertCards />

    <!-- 采购销售图表 -->
    <SalesChart />

    <!-- 排行榜 -->
    <RankingTabs />

    <!-- 初始化字典（隐藏组件） -->
    <initDict />
  </div>
</template>

<style lang="scss" scoped>
.welcome-container {
  max-width: 1600px;
  margin: 0 auto;
}
</style>
