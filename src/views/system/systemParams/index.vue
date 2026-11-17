<script setup lang="ts">
import { ref, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import RuntimeTab from "./tabs/RuntimeTab.vue";
import LoggingTab from "./tabs/LoggingTab.vue";
import IntegrationsTab from "./tabs/IntegrationsTab.vue";
import AuditSecurityTab from "./tabs/AuditSecurityTab.vue";

defineOptions({
  name: "SystemParams"
});

const TABS = [
  { key: "runtime", label: "运行与容量", component: RuntimeTab },
  { key: "logging", label: "日志与审计", component: LoggingTab },
  { key: "integrations", label: "集成与通知", component: IntegrationsTab },
  { key: "audit-security", label: "审计与安全", component: AuditSecurityTab }
] as const;

type TabKey = (typeof TABS)[number]["key"];

const DEFAULT_TAB: TabKey = "runtime";

const route = useRoute();
const router = useRouter();

function resolveTab(raw: unknown): TabKey {
  const key = String(raw ?? "");
  const matched = TABS.find(tab => tab.key === key);
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
      <div class="px-6 pt-5 pb-2 flex justify-between items-start gap-4">
        <div>
          <h3 class="text-lg font-medium">系统参数</h3>
          <p class="text-sm text-gray-500 mt-1">
            集中管理平台级运行参数；保存后立即生效，无需重启。敏感密钥与重启类配置不在此维护。
          </p>
        </div>
        <el-button
          link
          type="primary"
          @click="router.push('/system/systemSetting')"
        >
          高级配置
        </el-button>
      </div>

      <el-alert
        title="未修改的字段不会写入数据库：留空/未编辑时继续使用环境变量或默认值。"
        type="info"
        :closable="false"
        class="mx-6 mb-2"
      />

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
