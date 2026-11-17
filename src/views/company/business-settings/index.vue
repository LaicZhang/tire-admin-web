<script setup lang="ts">
import { ref, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import BasicTab from "./tabs/BasicTab.vue";
import OrderTab from "./tabs/OrderTab.vue";
import StockTab from "./tabs/StockTab.vue";
import PricingTab from "./tabs/PricingTab.vue";
import CostTab from "./tabs/CostTab.vue";
import ClaimAssetTab from "./tabs/ClaimAssetTab.vue";
import SettlementTab from "./tabs/SettlementTab.vue";
import BarcodeTab from "./tabs/BarcodeTab.vue";

defineOptions({
  name: "CompanyBusinessSettings"
});

const TABS = [
  { key: "basic", label: "基础开关", component: BasicTab },
  { key: "order", label: "单据与审核", component: OrderTab },
  { key: "stock", label: "库存与批次", component: StockTab },
  { key: "pricing", label: "价格与税务", component: PricingTab },
  { key: "cost", label: "成本", component: CostTab },
  { key: "claim-asset", label: "理赔与资产", component: ClaimAssetTab },
  { key: "settlement", label: "结算与资金", component: SettlementTab },
  { key: "barcode", label: "条码", component: BarcodeTab }
] as const;

type TabKey = (typeof TABS)[number]["key"];

const DEFAULT_TAB: TabKey = "basic";

const route = useRoute();
const router = useRouter();

function resolveTab(raw: unknown): TabKey {
  const key = String(raw ?? "");
  const matched = TABS.find(t => t.key === key);
  return matched ? matched.key : DEFAULT_TAB;
}

const activeTab = ref<TabKey>(resolveTab(route.query.tab));

watch(
  () => route.query.tab,
  raw => {
    activeTab.value = resolveTab(raw);
  }
);

async function handleTabChange(name: string | number) {
  const key = resolveTab(name);
  if (route.query.tab === key) return;
  await router.replace({ query: { ...route.query, tab: key } });
}
</script>

<template>
  <div class="main p-4">
    <div class="bg-white rounded-md">
      <div class="px-6 pt-5 pb-2">
        <h3 class="text-lg font-medium">业务设置</h3>
        <p class="text-sm text-gray-500 mt-1">
          集中管理公司业务流程中的开关、单据、库存、价格、成本等策略，按标签页分组保存。
        </p>
      </div>

      <el-tabs
        v-model="activeTab"
        class="px-6 pb-2"
        @tab-change="handleTabChange"
      >
        <el-tab-pane
          v-for="tab in TABS"
          :key="tab.key"
          :label="tab.label"
          :name="tab.key"
          lazy
        >
          <component :is="tab.component" />
        </el-tab-pane>
      </el-tabs>
    </div>
  </div>
</template>
