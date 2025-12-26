<script setup lang="ts">
import { computed } from "vue";
import { isUrl } from "@pureadmin/utils";
import { menuType } from "@/layout/types";

defineOptions({
  name: "LinkItem"
});

const props = defineProps<{
  to: menuType;
}>();

const isExternalLink = computed(() => isUrl(props.to.name));
</script>

<template>
  <!--
    内部菜单：不要用 router-link 包裹 el-menu-item（会导致不合法 DOM 结构，且影响 el-menu 的 router/index 跳转）
    直接依赖 el-menu 的 `router` 模式 + el-menu-item 的 `index` 完成跳转
  -->
  <a
    v-if="isExternalLink"
    :href="to.name"
    target="_blank"
    rel="noopener"
    @click.stop
  >
    <slot />
  </a>
  <slot v-else />
</template>
