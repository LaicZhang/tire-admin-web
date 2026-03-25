<script setup lang="ts">
import { onMounted, watch } from "vue";
import { useCurrentCompanyStoreHook } from "@/store/modules/company";
import { preloadDicts } from "@/composables/useSysDict";
import { logger } from "@/utils/logger";

const companyStore = useCurrentCompanyStoreHook();

async function preloadSystemDicts() {
  try {
    await preloadDicts({ source: "system" });
  } catch (error) {
    logger.error("预热系统字典失败", error);
  }
}

async function preloadCompanyDicts(companyId: string) {
  try {
    await preloadDicts({ source: "company", companyId });
  } catch (error) {
    logger.error("预热公司字典失败", error);
  }
}

onMounted(() => {
  void preloadSystemDicts();
});

watch(
  () => companyStore.companyId,
  companyId => {
    if (!companyId) return;
    void preloadCompanyDicts(companyId);
  },
  { immediate: true }
);
</script>

<template>
  <div />
</template>
