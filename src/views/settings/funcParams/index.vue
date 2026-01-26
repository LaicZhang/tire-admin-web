<script setup lang="ts">
import { onMounted, ref } from "vue";
import { message } from "@/utils";
import {
  getSettingGroupApi,
  batchUpdateSettingsApi,
  type SettingItem
} from "@/api/setting";
import type { FuncParams } from "./types";

defineOptions({
  name: "FuncParams"
});

const loading = ref(false);
const formRef = ref();

const formData = ref<FuncParams>({
  enableAudit: false,
  enableTax: false,
  defaultTaxRate: 13,
  enableAutoTaxPrice: false,
  enableAdvancedPrint: false,
  enableAuxAttribute: false,
  enableShelfLife: false,
  enableBatch: false,
  enableSerialNumber: false,
  allowNegativeStock: false,
  enableAutoFillSettlement: false,
  disableSalesDateEdit: false,
  allowExceedSalesOrder: false,
  allowExceedPurchaseOrder: false,
  enableShelfLifeAlert: false,
  allowBelowMinPrice: false,
  allowAboveMaxPrice: false
});

const loadSettings = async () => {
  loading.value = true;
  try {
    const { code, data } = await getSettingGroupApi();
    if (code === 200 && data) {
      const funcSettings = data.filter((s: SettingItem) => s.group === "func");
      funcSettings.forEach((s: SettingItem) => {
        const key = s.key as keyof FuncParams;
        if (key in formData.value) {
          const val = s.value;
          (formData.value as Record<keyof FuncParams, unknown>)[key] =
            val === "true"
              ? true
              : val === "false"
                ? false
                : Number(val) || val;
        }
      });
    }
  } catch {
    message("加载设置失败", { type: "error" });
  } finally {
    loading.value = false;
  }
};

const handleSave = async () => {
  loading.value = true;
  try {
    const { code } = await batchUpdateSettingsApi("func", formData.value);
    if (code === 200) {
      message("保存成功", { type: "success" });
    } else {
      message("保存失败", { type: "error" });
    }
  } catch {
    message("保存失败", { type: "error" });
  } finally {
    loading.value = false;
  }
};

onMounted(() => {
  loadSettings();
});
</script>

<template>
  <div class="main">
    <div class="bg-white p-6 rounded-md">
      <div class="flex justify-between items-center mb-6">
        <h3 class="text-lg font-medium">功能参数设置</h3>
        <el-button type="primary" :loading="loading" @click="handleSave">
          保存设置
        </el-button>
      </div>

      <el-form
        ref="formRef"
        :model="formData"
        label-width="200px"
        label-position="left"
      >
        <!-- 审核设置 -->
        <el-divider content-position="left">审核设置</el-divider>
        <el-form-item label="启用审核">
          <el-switch v-model="formData.enableAudit" />
          <span class="ml-4 text-gray-500 text-sm">
            启用后，系统中的所有单据需要审核后库存增减才会生效
          </span>
        </el-form-item>

        <!-- 税金设置 -->
        <el-divider content-position="left">税金设置</el-divider>
        <el-form-item label="启用税金">
          <el-switch v-model="formData.enableTax" />
          <span class="ml-4 text-gray-500 text-sm">
            启用后，采购和销售的单据会增加"税率""税额""价税合计"列
          </span>
        </el-form-item>
        <el-form-item v-if="formData.enableTax" label="默认税率(%)">
          <el-input-number
            v-model="formData.defaultTaxRate"
            :min="0"
            :max="100"
            :precision="2"
          />
        </el-form-item>
        <el-form-item label="启用自动带入含税单价">
          <el-switch v-model="formData.enableAutoTaxPrice" />
          <span class="ml-4 text-gray-500 text-sm">
            开启后，价格策略的价格可自动带入到含税单价中
          </span>
        </el-form-item>

        <!-- 打印设置 -->
        <el-divider content-position="left">打印设置</el-divider>
        <el-form-item label="启用高级打印模板">
          <el-switch v-model="formData.enableAdvancedPrint" />
          <span class="ml-4 text-gray-500 text-sm">
            启用后单据默认选择使用高级打印模板进行打印
          </span>
        </el-form-item>

        <!-- 商品属性 -->
        <el-divider content-position="left">商品属性</el-divider>
        <el-form-item label="启用辅助属性">
          <el-switch v-model="formData.enableAuxAttribute" />
          <span class="ml-4 text-gray-500 text-sm">
            启用后，允许商品新增服装、尺码等自定义属性
          </span>
        </el-form-item>
        <el-form-item label="启用保质期">
          <el-switch v-model="formData.enableShelfLife" />
          <span class="ml-4 text-gray-500 text-sm">
            开启后可智能进行保质期管理
          </span>
        </el-form-item>
        <el-form-item label="启用批次">
          <el-switch v-model="formData.enableBatch" />
          <span class="ml-4 text-gray-500 text-sm">
            启动后，允许录入商品的批次
          </span>
        </el-form-item>
        <el-form-item label="启用序列号">
          <el-switch v-model="formData.enableSerialNumber" />
          <span class="ml-4 text-gray-500 text-sm">
            启动后，允许录入商品的序列号
          </span>
        </el-form-item>

        <!-- 库存设置 -->
        <el-divider content-position="left">库存设置</el-divider>
        <el-form-item label="可用库存允许为负">
          <el-switch v-model="formData.allowNegativeStock" />
          <span class="ml-4 text-gray-500 text-sm">
            启用后，库存不足时也允许保存出库类型的单据
          </span>
        </el-form-item>

        <!-- 结算设置 -->
        <el-divider content-position="left">结算设置</el-divider>
        <el-form-item label="启用自动填充结算金额">
          <el-switch v-model="formData.enableAutoFillSettlement" />
          <span class="ml-4 text-gray-500 text-sm">
            启用后，系统自动填充本次付款/收款金额
          </span>
        </el-form-item>

        <!-- 单据日期 -->
        <el-divider content-position="left">单据日期</el-divider>
        <el-form-item label="销售类单据不允许修改日期">
          <el-switch v-model="formData.disableSalesDateEdit" />
          <span class="ml-4 text-gray-500 text-sm">
            启用后，销售类的所有单据都不允许修改单据日期
          </span>
        </el-form-item>

        <!-- 订单超量设置 -->
        <el-divider content-position="left">订单超量设置</el-divider>
        <el-form-item label="允许超销售订单数量进行销售">
          <el-switch v-model="formData.allowExceedSalesOrder" />
          <span class="ml-4 text-gray-500 text-sm">
            启用后，允许单据商品数量大于销售订单数量
          </span>
        </el-form-item>
        <el-form-item label="允许超采购订单数量进行采购">
          <el-switch v-model="formData.allowExceedPurchaseOrder" />
          <span class="ml-4 text-gray-500 text-sm">
            启用后，允许单据商品数量大于采购订单数量
          </span>
        </el-form-item>

        <!-- 保质期提示 -->
        <el-divider content-position="left">保质期提示</el-divider>
        <el-form-item label="过保质期商品销售出库提示">
          <el-switch v-model="formData.enableShelfLifeAlert" />
          <span class="ml-4 text-gray-500 text-sm">
            过期后，过保质期的商品在录入出库单时会进行提示
          </span>
        </el-form-item>

        <!-- 限价设置 -->
        <el-divider content-position="left">限价设置</el-divider>
        <el-form-item label="允许低于最低销售价保存单据">
          <el-switch v-model="formData.allowBelowMinPrice" />
          <span class="ml-4 text-gray-500 text-sm">
            启用后，实际销售价低于最低销售价时允许保存成功
          </span>
        </el-form-item>
        <el-form-item label="允许高于最高采购价保存单据">
          <el-switch v-model="formData.allowAboveMaxPrice" />
          <span class="ml-4 text-gray-500 text-sm">
            启用后，实际采购价高于最高采购价时允许保存成功
          </span>
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
