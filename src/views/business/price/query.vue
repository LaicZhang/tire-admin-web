<script setup lang="ts">
import { ref } from "vue";
import type { FormInstance, FormRules } from "element-plus";
import {
  queryPriceApi,
  type PriceQueryResult
} from "@/api/business/price-list";
import CustomerSelect from "@/components/EntitySelect/CustomerSelect.vue";
import TireSelect from "@/components/EntitySelect/TireSelect.vue";
import { message } from "@/utils";
import { elementRules } from "@/utils/validation/elementRules";

defineOptions({
  name: "PriceQuery"
});

const form = ref({
  tireId: undefined as string | undefined,
  customerId: undefined as string | undefined,
  date: new Date()
});
const formRef = ref<FormInstance>();
const rules: FormRules = {
  tireId: [
    elementRules.requiredSelect("请选择商品", "change"),
    elementRules.uuidV4("商品不合法", "change")
  ],
  customerId: [elementRules.uuidV4("客户不合法", "change")]
};
const result = ref<PriceQueryResult | null>(null);
const loading = ref(false);

const onSearch = async () => {
  const valid = await formRef.value?.validate().catch(() => false);
  if (!valid) return;
  loading.value = true;
  const { data, code, msg } = await queryPriceApi({
    tireId: form.value.tireId ?? "",
    customerId: form.value.customerId ?? "",
    quantity: 1
  });
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

      <el-form ref="formRef" :model="form" :rules="rules" :inline="true">
        <el-form-item label="商品" prop="tireId">
          <TireSelect v-model="form.tireId" placeholder="搜索商品名称/条码" />
        </el-form-item>
        <el-form-item label="客户" prop="customerId">
          <CustomerSelect
            v-model="form.customerId"
            placeholder="选填，搜索客户"
          />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" :loading="loading" @click="onSearch"
            >查询</el-button
          >
        </el-form-item>
      </el-form>

      <div v-if="result" class="mt-4">
        <el-descriptions title="查询结果" border>
          <el-descriptions-item label="执行价格">{{
            result.price
          }}</el-descriptions-item>
          <el-descriptions-item label="价格来源">{{
            result.source
          }}</el-descriptions-item>
          <el-descriptions-item label="价格类型">{{
            result.priceType
          }}</el-descriptions-item>
        </el-descriptions>
      </div>
    </el-card>
  </div>
</template>
