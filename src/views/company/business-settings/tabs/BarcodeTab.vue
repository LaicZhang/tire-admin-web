<script setup lang="ts">
import { useRouter } from "vue-router";

defineOptions({
  name: "BusinessSettingsBarcodeTab"
});

const router = useRouter();

function goBarcodeSettings() {
  void router.push("/company/barcode-settings");
}
</script>

<template>
  <div>
    <h4 class="text-base font-medium mb-4">条码</h4>

    <el-alert
      class="mb-4"
      type="info"
      :closable="false"
      title="条码格式与自动生成策略在“条码设置”页面维护。"
    />

    <el-button type="primary" plain @click="goBarcodeSettings">
      前往条码设置
    </el-button>
  </div>
</template>
