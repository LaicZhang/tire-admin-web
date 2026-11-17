<script setup lang="ts">
import SystemParamGroupPanel from "../components/SystemParamGroupPanel.vue";

defineOptions({
  name: "SystemParamsRuntimeTab"
});

const SECTIONS = [
  {
    title: "请求与容量",
    keys: [
      "requestTimeoutMs",
      "maxQueryLimit",
      "importMaxRows",
      "inventoryImportMaxRows",
      "exportMaxRows",
      "maxFileSizeBytes",
      "cronJobTimeoutMs"
    ]
  }
] as const;
</script>

<template>
  <SystemParamGroupPanel
    title="运行与容量"
    description="控制请求超时、分页与导入上限、定时任务超时；保存后立即生效（无需重启）。"
    :groups="['ops']"
    :sections="SECTIONS"
  />
</template>
