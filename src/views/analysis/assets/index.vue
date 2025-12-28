<script setup lang="ts">
import { ref, onMounted } from "vue";
import { getAssetListApi } from "@/api";
import { message } from "@/utils";
import { useRenderIcon } from "@/components/ReIcon/src/hooks";
import Refresh from "~icons/ep/refresh";

defineOptions({
  name: "AnalysisAssets"
});

interface AssetStatItem {
  name: string;
  value: number;
}

interface AssetItem {
  type: number;
  currentValue?: { value: number | string };
}

const loading = ref(false);
const totalAssets = ref(0);
const totalValue = ref(0);
// Placeholder for charts or detailed stats
const assetStats = ref<AssetStatItem[]>([]);

const getStats = async () => {
  loading.value = true;
  try {
    // Currently using list API to calculate simple stats
    // Ideally should be a dedicated stats API
    const { data, code, msg } = await getAssetListApi(1, { pageSize: 1000 }); // Fetch a large batch to calculate
    if (code === 200) {
      const typedData = data as { list?: AssetItem[]; count?: number };
      const list = typedData.list || [];
      totalAssets.value = typedData.count || list.length;
      totalValue.value = list.reduce(
        (acc: number, cur: AssetItem) =>
          acc + (Number(cur.currentValue?.value) || 0),
        0
      );

      // Group by type
      const typeMap: Record<string, number> = {};
      list.forEach((item: AssetItem) => {
        const type = item.type === 0 ? "固定资产" : "消耗品";
        if (!typeMap[type]) typeMap[type] = 0;
        typeMap[type]++;
      });
      assetStats.value = Object.keys(typeMap).map(key => ({
        name: key,
        value: typeMap[key]
      }));
    } else {
      message(msg, { type: "error" });
    }
  } catch (error: unknown) {
    const errorMsg =
      error instanceof Error ? error.message : "获取资产数据失败";
    message(errorMsg, { type: "error" });
  } finally {
    loading.value = false;
  }
};

onMounted(() => {
  getStats();
});
</script>

<template>
  <div class="main">
    <el-card class="m-1">
      <template #header>
        <div class="card-header flex justify-between items-center">
          <span>资产数据概览</span>
          <el-button :icon="useRenderIcon(Refresh)" circle @click="getStats" />
        </div>
      </template>
      <div v-loading="loading" class="flex justify-around text-center">
        <div>
          <div class="text-gray-500">资产总数</div>
          <div class="text-2xl font-bold">{{ totalAssets }}</div>
        </div>
        <div>
          <div class="text-gray-500">资产总价值</div>
          <div class="text-2xl font-bold">¥{{ totalValue.toFixed(2) }}</div>
        </div>
      </div>
    </el-card>

    <el-card class="m-1 mt-4">
      <template #header>
        <span>资产分类统计</span>
      </template>
      <div
        v-if="assetStats.length"
        v-loading="loading"
        class="flex justify-center"
      >
        <div
          v-for="stat in assetStats"
          :key="stat.name"
          class="mx-4 text-center"
        >
          <div class="text-gray-500">{{ stat.name }}</div>
          <div class="text-xl font-semibold">{{ stat.value }}</div>
        </div>
      </div>
      <div v-else class="text-center text-gray-400 py-4">暂无数据</div>
    </el-card>
  </div>
</template>
