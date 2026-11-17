<script setup lang="ts">
import SystemParamGroupPanel from "../components/SystemParamGroupPanel.vue";

defineOptions({
  name: "SystemParamsLoggingTab"
});

const SECTIONS = [
  {
    title: "操作日志",
    keys: [
      "operationLogMaxChars",
      "operationLogSamplingRate",
      "operationLogMaxQueueSize",
      "operationLogQueueSizeCacheMs",
      "operationLogBackoffDelayMs",
      "operationLogFailedRetentionMs"
    ]
  },
  { title: "搜索日志", keys: ["searchLogSampleRate"] },
  {
    title: "归档与审计",
    keys: ["logArchiveBatchSize", "auditExportBatchSize"]
  }
] as const;
</script>

<template>
  <SystemParamGroupPanel
    title="日志与审计"
    description="调整操作日志/搜索日志采样、队列与归档批大小；采样率 0 会停止写入操作日志，请谨慎设置。"
    :groups="['logging']"
    :sections="SECTIONS"
  />
</template>
