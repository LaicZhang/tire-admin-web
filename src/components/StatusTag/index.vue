<script setup lang="ts">
import { computed } from "vue";
import type { StatusTagProps } from "./types";

defineOptions({
  name: "StatusTag"
});

const props = withDefaults(defineProps<StatusTagProps>(), {
  size: "small",
  round: false
});

const statusConfig = computed(() => {
  const key = String(props.status);
  return (
    props.statusMap[key] ||
    props.statusMap[props.status as string] || { label: "未知", type: "info" }
  );
});

const tagType = computed(() => statusConfig.value.type || "");
const tagLabel = computed(() => statusConfig.value.label);
</script>

<template>
  <el-tag :type="tagType" :size="size" :round="round">
    {{ tagLabel }}
  </el-tag>
</template>
