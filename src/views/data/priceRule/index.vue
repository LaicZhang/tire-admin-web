<script setup lang="ts">
import { ref, onMounted, computed } from "vue";
import { useRenderIcon } from "@/components/ReIcon/src/hooks";
import Refresh from "~icons/ep/refresh";
import UpIcon from "~icons/ep/arrow-up";
import DownIcon from "~icons/ep/arrow-down";
import SaveIcon from "~icons/ep/check";
import { message } from "@/utils";
import { PureTableBar } from "@/components/RePureTableBar";
import type { PriceRule } from "./types";
import {
  getPriceRuleConfigApi,
  savePriceRuleConfigApi,
  type PriceRuleConfig
} from "@/api/data/price-rule";
import { useCrud } from "@/composables";

defineOptions({
  name: "PriceRule"
});

const activeTab = ref<"sale" | "purchase">("sale");

// 销售价格取数规则
const defaultSaleRules: PriceRule[] = [
  {
    id: 1,
    uid: "1",
    name: "客户等级价",
    code: "customer_level_price",
    description: "根据客户等级获取对应价格",
    enabled: true,
    priority: 1,
    type: "sale"
  },
  {
    id: 2,
    uid: "2",
    name: "客户协议价",
    code: "customer_contract_price",
    description: "客户专属协议价格",
    enabled: true,
    priority: 2,
    type: "sale"
  },
  {
    id: 3,
    uid: "3",
    name: "最近销售价",
    code: "last_sale_price",
    description: "该客户最近一次购买价格",
    enabled: true,
    priority: 3,
    type: "sale"
  },
  {
    id: 4,
    uid: "4",
    name: "商品售价",
    code: "product_sale_price",
    description: "商品基础资料中的售价",
    enabled: true,
    priority: 4,
    type: "sale"
  },
  {
    id: 5,
    uid: "5",
    name: "商品零售价",
    code: "product_retail_price",
    description: "商品价格资料中的零售价",
    enabled: false,
    priority: 5,
    type: "sale"
  }
];
const {
  loading: saleLoading,
  dataList: saleRules,
  fetchData: fetchSaleRules
} = useCrud<
  PriceRule,
  PriceRuleConfig | null,
  { page: number; pageSize: number }
>({
  api: () => getPriceRuleConfigApi(),
  transform: (res: PriceRuleConfig | null) => {
    const list = (res?.saleRules ?? []) as PriceRule[];
    return {
      list: list.length ? list : defaultSaleRules.map(r => ({ ...r })),
      total: list.length
    };
  },
  immediate: false
});

// 采购价格取数规则
const defaultPurchaseRules: PriceRule[] = [
  {
    id: 1,
    uid: "1",
    name: "供应商协议价",
    code: "supplier_contract_price",
    description: "供应商专属协议价格",
    enabled: true,
    priority: 1,
    type: "purchase"
  },
  {
    id: 2,
    uid: "2",
    name: "最近采购价",
    code: "last_purchase_price",
    description: "该供应商最近一次采购价格",
    enabled: true,
    priority: 2,
    type: "purchase"
  },
  {
    id: 3,
    uid: "3",
    name: "商品进价",
    code: "product_purchase_price",
    description: "商品基础资料中的进价",
    enabled: true,
    priority: 3,
    type: "purchase"
  }
];
const {
  loading: purchaseLoading,
  dataList: purchaseRules,
  fetchData: fetchPurchaseRules
} = useCrud<
  PriceRule,
  PriceRuleConfig | null,
  { page: number; pageSize: number }
>({
  api: () => getPriceRuleConfigApi(),
  transform: (res: PriceRuleConfig | null) => {
    const list = (res?.purchaseRules ?? []) as PriceRule[];
    return {
      list: list.length ? list : defaultPurchaseRules.map(r => ({ ...r })),
      total: list.length
    };
  },
  immediate: false
});

const loading = computed(() => saleLoading.value || purchaseLoading.value);

const currentRules = computed(() => {
  return activeTab.value === "sale" ? saleRules.value : purchaseRules.value;
});

const columns = [
  { label: "优先级", prop: "priority", width: 80 },
  { label: "规则名称", prop: "name", width: 150 },
  { label: "规则代码", prop: "code", width: 180 },
  { label: "规则描述", prop: "description" },
  { label: "启用状态", prop: "enabled", slot: "enabled", width: 100 },
  { label: "排序", prop: "sort", slot: "sort", width: 120 }
];

const handleToggleEnabled = (row: PriceRule) => {
  row.enabled = !row.enabled;
  message(`${row.enabled ? "启用" : "禁用"}规则：${row.name}`, {
    type: "success"
  });
};

const handleMoveUp = (index: number) => {
  const rules = activeTab.value === "sale" ? saleRules : purchaseRules;
  if (index === 0) return;

  const temp = rules.value[index];
  rules.value[index] = rules.value[index - 1];
  rules.value[index - 1] = temp;

  // 更新优先级
  updatePriority(rules.value);
};

const handleMoveDown = (index: number) => {
  const rules = activeTab.value === "sale" ? saleRules : purchaseRules;
  if (index === rules.value.length - 1) return;

  const temp = rules.value[index];
  rules.value[index] = rules.value[index + 1];
  rules.value[index + 1] = temp;

  // 更新优先级
  updatePriority(rules.value);
};

const updatePriority = (rules: PriceRule[]) => {
  rules.forEach((rule, idx) => {
    rule.priority = idx + 1;
  });
};

const handleSave = () => {
  savePriceRuleConfigApi({
    saleRules: saleRules.value,
    purchaseRules: purchaseRules.value
  }).then(() => message("保存成功", { type: "success" }));
};

const refreshData = async () => {
  try {
    await Promise.all([fetchSaleRules(), fetchPurchaseRules()]);
    message("刷新成功", { type: "success" });
  } catch {
    // ignore (useCrud already handles error)
  }
};

onMounted(() => {
  saleRules.value = defaultSaleRules.map(r => ({ ...r }));
  purchaseRules.value = defaultPurchaseRules.map(r => ({ ...r }));
  refreshData();
});
</script>

<template>
  <div class="main">
    <el-card class="m-1">
      <el-alert type="info" :closable="false" show-icon class="mb-4">
        <template #title>
          <span class="font-bold">价格取数规则说明</span>
        </template>
        <template #default>
          <div class="text-sm">
            系统会按照优先级从高到低依次尝试获取价格，获取到有效价格后停止。您可以通过启用/禁用和调整顺序来配置价格取数策略。
          </div>
        </template>
      </el-alert>

      <el-tabs v-model="activeTab">
        <el-tab-pane label="销售价格取数规则" name="sale" />
        <el-tab-pane label="采购价格取数规则" name="purchase" />
      </el-tabs>

      <PureTableBar
        :title="activeTab === 'sale' ? '销售价格取数规则' : '采购价格取数规则'"
        @refresh="refreshData"
      >
        <template #buttons>
          <el-button
            type="primary"
            :icon="useRenderIcon(SaveIcon)"
            @click="handleSave"
          >
            保存设置
          </el-button>
        </template>
        <template v-slot="{ size }">
          <pure-table
            row-key="uid"
            adaptive
            :size
            :columns
            border
            :data="currentRules"
            :loading="loading"
            showOverflowTooltip
          >
            <template #enabled="{ row }">
              <el-switch
                :model-value="row.enabled"
                @change="handleToggleEnabled(row)"
              />
            </template>
            <template #sort="{ $index }">
              <el-button
                link
                type="primary"
                :disabled="$index === 0"
                @click="handleMoveUp($index)"
              >
                <IconifyIconOffline :icon="UpIcon" />
                上移
              </el-button>
              <el-button
                link
                type="primary"
                :disabled="$index === currentRules.length - 1"
                @click="handleMoveDown($index)"
              >
                <IconifyIconOffline :icon="DownIcon" />
                下移
              </el-button>
            </template>
          </pure-table>
        </template>
      </PureTableBar>

      <el-divider content-position="left">规则执行流程</el-divider>

      <div class="p-4 bg-gray-50 rounded">
        <el-steps
          :active="currentRules.filter(r => r.enabled).length"
          align-center
        >
          <el-step
            v-for="rule in currentRules.filter(r => r.enabled)"
            :key="rule.uid"
            :title="rule.name"
            :description="`优先级 ${rule.priority}`"
          />
        </el-steps>
      </div>
    </el-card>
  </div>
</template>
