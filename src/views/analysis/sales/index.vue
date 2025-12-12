<script setup lang="ts">
import { ref, onMounted } from "vue";
import { getSaleOrderCountApi, getPurchaseOrderCountApi } from "@/api";
// Note: getSaleOrderCountApi might return data structure different than expected, need to verify
import { message } from "@/utils";
import { useRenderIcon } from "@/components/ReIcon/src/hooks";
import Refresh from "~icons/ep/refresh";

defineOptions({
  name: "AnalysisSales"
});

const loading = ref(false);
const saleCount = ref(0);
const purchaseCount = ref(0);

const getStats = async () => {
  loading.value = true;
  try {
    const [saleRes, purchaseRes] = await Promise.all([
      getSaleOrderCountApi(),
      getPurchaseOrderCountApi()
    ]);

    if (saleRes.code === 200) {
      // Assuming data is a number or an object with count
      saleCount.value =
        typeof saleRes.data === "number"
          ? saleRes.data
          : saleRes.data?.count || 0;
    }
    if (purchaseRes.code === 200) {
      purchaseCount.value =
        typeof purchaseRes.data === "number"
          ? purchaseRes.data
          : purchaseRes.data?.count || 0;
    }
  } catch (error) {
    message(error.message || "获取销售/采购数据失败", { type: "error" });
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
          <span>业务数据概览</span>
          <el-button :icon="useRenderIcon(Refresh)" circle @click="getStats" />
        </div>
      </template>
      <div v-loading="loading" class="flex justify-around text-center">
        <div>
          <div class="text-gray-500">销售订单总数</div>
          <div class="text-2xl font-bold text-blue-500">{{ saleCount }}</div>
        </div>
        <div>
          <div class="text-gray-500">采购订单总数</div>
          <div class="text-2xl font-bold text-green-500">
            {{ purchaseCount }}
          </div>
        </div>
      </div>
    </el-card>
  </div>
</template>
