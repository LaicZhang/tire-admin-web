<script setup lang="ts">
import { computed } from "vue";

const props = defineProps<{
  missingKeys?: readonly string[];
  unsetKeys?: readonly string[];
}>();

const state = computed(() => {
  const missing = props.missingKeys?.length ?? 0;
  const unset = props.unsetKeys?.length ?? 0;
  if (missing > 0) return { text: `缺失 ${missing}`, type: "danger" as const };
  if (unset > 0) return { text: `未设置 ${unset}`, type: "warning" as const };
  return null;
});
</script>

<template>
  <el-tag v-if="state" :type="state.type" size="small" class="ml-2">
    {{ state.text }}
  </el-tag>
</template>
