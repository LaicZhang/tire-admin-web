<script setup lang="ts">
import { onMounted } from "vue";
import { useRoute, useRouter } from "vue-router";
import { message } from "@/utils";

defineOptions({
  name: "SalesOutboundRedirect"
});

const route = useRoute();
const router = useRouter();

onMounted(() => {
  message("销售出库入口已并入销售订单履约流程", { type: "info" });
  router.replace({
    path: "/sales/order",
    query: route.query
  });
});
</script>

<template>
  <div class="main">
    <el-card class="m-1">
      <div class="py-8 text-center text-sm text-gray-500">
        正在跳转到销售订单履约入口...
      </div>
    </el-card>
  </div>
</template>
