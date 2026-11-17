<script setup lang="ts">
import SystemParamGroupPanel from "../components/SystemParamGroupPanel.vue";

defineOptions({
  name: "SystemParamsIntegrationsTab"
});

const SECTIONS = [
  { title: "邮件通知", keys: ["EMAIL_HOST", "EMAIL_PORT"] },
  {
    title: "短信通知",
    keys: [
      "TENCENT_SMS_APP_ID",
      "TENCENT_SMS_SIGN_NAME",
      "TENCENT_SMS_TEMPLATE_ID"
    ]
  },
  { title: "微信", keys: ["WX_APP_ID"] },
  {
    title: "外部 API",
    keys: [
      "EXTERNAL_API_ALLOWED_HOSTS",
      "EXTERNAL_API_TRANSLATE_URL",
      "EXTERNAL_API_IP_URL"
    ]
  },
  {
    title: "认证与安全",
    keys: ["BETTER_AUTH_TRUSTED_ORIGINS", "PAYLOAD_SANITIZE_MODE"]
  },
  { title: "操作日志", keys: ["OP_LOG_CRITICAL_PATHS"] },
  { title: "备份", keys: ["BACKUP_CRON_EXPRESSION"] }
] as const;
</script>

<template>
  <SystemParamGroupPanel
    title="集成与通知"
    description="配置邮件、短信、微信与外部 API 等集成参数；敏感密钥不在此维护，仍由部署环境提供。"
    :groups="['env']"
    :sections="SECTIONS"
  />
</template>
