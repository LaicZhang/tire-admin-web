<script setup lang="ts">
import { useRouter } from "vue-router";

defineOptions({
  name: "BusinessSettingsSettlementTab"
});

const router = useRouter();

function goSettlementDefaults() {
  void router.push("/company/settlement-defaults");
}
</script>

<template>
  <div>
    <h4 class="text-base font-medium mb-4">结算与资金</h4>

    <el-alert
      class="mb-4"
      type="info"
      :closable="false"
      title="默认结算方式、默认收付款账户与单据允许回填天数在“结算默认值”页面维护；信用额度与大额资金确认属于资金风控策略，将在后续版本开放。"
    />

    <el-button type="primary" plain @click="goSettlementDefaults">
      前往结算默认值
    </el-button>
  </div>
</template>
