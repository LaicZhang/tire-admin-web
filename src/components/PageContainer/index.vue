<script setup lang="ts">
import { useSlots } from "vue";
import type { PageContainerProps } from "./types";

defineOptions({
  name: "PageContainer"
});

const props = withDefaults(defineProps<PageContainerProps>(), {
  showSearch: true,
  shadow: "never",
  padding: "16px"
});

const slots = useSlots();
const hasSearchSlot = () => !!slots.search;
</script>

<template>
  <div class="page-container" :style="{ padding }">
    <el-card
      v-if="showSearch && hasSearchSlot()"
      class="search-card"
      :shadow="shadow"
    >
      <slot name="search" />
    </el-card>
    <el-card :shadow="shadow" class="content-card">
      <slot />
    </el-card>
  </div>
</template>

<style scoped lang="scss">
.page-container {
  min-height: 100%;
}

.search-card {
  margin-bottom: 16px;
}

.content-card {
  :deep(.el-card__body) {
    padding: 16px;
  }
}
</style>
