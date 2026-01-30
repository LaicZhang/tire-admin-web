<script setup lang="ts">
import { ref } from "vue";
import {
  getProductPriceApi,
  type ProductPriceQueryResult
} from "@/api/business/price";
import { message } from "@/utils";

defineOptions({
  name: "PriceQuery"
});

const form = ref({
  tireId: undefined,
  customerId: undefined,
  date: new Date()
});
const result = ref<ProductPriceQueryResult | null>(null);
const loading = ref(false);

// Simplified for now: just text inputs or simple selects could be implemented.
// Real implementation might use a TireSelect component.

const onSearch = async () => {
  if (!form.value.tireId) {
    message("请选择商品", { type: "warning" });
    return;
  }
  loading.value = true;
  const { data, code, msg } = await getProductPriceApi(form.value);
  if (code === 200) {
    result.value = data;
  } else {
    message(msg, { type: "error" });
  }
  loading.value = false;
};
</script>

<template>
  <div class="main">
    <el-card class="m-1">
      <template #header>
        <div class="flex justify-between">
          <span>价格查询</span>
        </div>
      </template>

      <el-form :inline="true">
        <el-form-item label="商品名称/条码">
          <el-input v-model="form.tireId" placeholder="输入ID或名称" />
        </el-form-item>
        <el-form-item label="客户">
          <el-input v-model="form.customerId" placeholder="选填，输入客户ID" />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" :loading="loading" @click="onSearch"
            >查询</el-button
          >
        </el-form-item>
      </el-form>

      <div v-if="result" class="mt-4">
        <el-descriptions title="查询结果" border>
          <el-descriptions-item label="商品">{{
            result.tireName
          }}</el-descriptions-item>
          <el-descriptions-item label="执行价格">{{
            result.price
          }}</el-descriptions-item>
          <el-descriptions-item label="价格来源">{{
            result.source
          }}</el-descriptions-item>
          <el-descriptions-item label="应用策略">{{
            result.strategy
          }}</el-descriptions-item>
        </el-descriptions>
      </div>
    </el-card>
  </div>
</template>
