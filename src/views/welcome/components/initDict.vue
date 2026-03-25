<script setup lang="ts">
import { onMounted } from "vue";
import { preloadDicts } from "@/composables/useSysDict";
import { logger } from "@/utils/logger";

defineOptions({
  name: "initDict"
});

const refreshDict = async () => {
  try {
    await preloadDicts({ source: "system" });
  } catch (error: unknown) {
    logger.error("初始化字典失败:", error);
  }
};

onMounted(() => {
  void refreshDict();
});
</script>

<template>
  <div />
</template>
