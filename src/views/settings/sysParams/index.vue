<script setup lang="ts">
import { useSettingsForm } from "@/composables";
import type { SysParams } from "./types";

defineOptions({
  name: "SysParams"
});

const currencyOptions = [{ label: "人民币 (RMB)", value: "RMB" }];

const decimalOptions = [
  { label: "0位", value: 0 },
  { label: "1位", value: 1 },
  { label: "2位", value: 2 },
  { label: "3位", value: 3 },
  { label: "4位", value: 4 }
];

const { loading, formRef, formData, handleSave } = useSettingsForm<SysParams>({
  group: "sys",
  defaults: () => ({
    companyName: "",
    enableDate: "",
    currency: "RMB",
    quantityDecimals: 2,
    priceDecimals: 2,
    amountDecimals: 2
  })
});
</script>

<template>
  <div class="main">
    <div class="bg-white p-6 rounded-md">
      <div class="flex justify-between items-center mb-6">
        <h3 class="text-lg font-medium">系统参数设置</h3>
        <el-button type="primary" :loading="loading" @click="handleSave">
          保存设置
        </el-button>
      </div>

      <el-form
        ref="formRef"
        :model="formData"
        label-width="120px"
        label-position="left"
        class="max-w-2xl"
      >
        <!-- 基本信息 -->
        <el-divider content-position="left">基本信息</el-divider>
        <el-form-item label="公司名称" prop="companyName">
          <el-input
            v-model="formData.companyName"
            placeholder="请输入公司名称"
          />
        </el-form-item>
        <el-form-item label="启用时间" prop="enableDate">
          <el-date-picker
            v-model="formData.enableDate"
            type="date"
            placeholder="选择启用日期"
            value-format="YYYY-MM-DD"
            :disabled="true"
          />
          <span class="ml-4 text-gray-500 text-sm">
            账套一旦使用，不能修改启用时间
          </span>
        </el-form-item>
        <el-form-item label="本位币" prop="currency">
          <el-select
            v-model="formData.currency"
            placeholder="请选择本位币"
            disabled
          >
            <el-option
              v-for="item in currencyOptions"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            />
          </el-select>
          <span class="ml-4 text-gray-500 text-sm">
            目前只支持RMB，暂不支持外币
          </span>
        </el-form-item>

        <!-- 小数位数设置 -->
        <el-divider content-position="left">小数位数设置</el-divider>
        <el-alert
          title="小数位选定后保存，不能由大改为小，请谨慎操作"
          type="warning"
          :closable="false"
          class="mb-4"
        />
        <el-form-item label="数量小数位" prop="quantityDecimals">
          <el-select v-model="formData.quantityDecimals" placeholder="请选择">
            <el-option
              v-for="item in decimalOptions"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="单价小数位" prop="priceDecimals">
          <el-select v-model="formData.priceDecimals" placeholder="请选择">
            <el-option
              v-for="item in decimalOptions"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="金额小数位" prop="amountDecimals">
          <el-select v-model="formData.amountDecimals" placeholder="请选择">
            <el-option
              v-for="item in decimalOptions"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            />
          </el-select>
        </el-form-item>
      </el-form>
    </div>
  </div>
</template>

<style scoped lang="scss">
.page-container {
  @extend .page-container;
}

:deep(.el-divider__text) {
  font-weight: 600;
  color: #303133;
}
</style>
