<script setup lang="ts">
import SystemParamGroupPanel from "../components/SystemParamGroupPanel.vue";

defineOptions({
  name: "SystemParamsAuditSecurityTab"
});

const SECTIONS = [
  {
    title: "对象存储审计",
    keys: [
      "s3Enabled",
      "s3Bucket",
      "s3Prefix",
      "s3RetentionDays",
      "s3ObjectLockMode"
    ]
  },
  {
    title: "病毒扫描",
    keys: ["virusScanEnabled", "clamdHost", "clamdPort", "virusScanTimeoutMs"]
  }
] as const;
</script>

<template>
  <SystemParamGroupPanel
    title="审计与安全"
    description="配置资金审计事件的对象存储导出与上传文件病毒扫描；凭据等敏感配置仍由部署环境提供。"
    :groups="['audit', 'security']"
    :sections="SECTIONS"
  />
</template>
