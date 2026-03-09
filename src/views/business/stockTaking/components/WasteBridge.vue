<script setup lang="ts">
import OrderBridge from "./OrderBridge.vue";
import { ORDER_TYPE } from "@/utils/const";
</script>

<template>
  <OrderBridge :order-type="ORDER_TYPE.waste" />
</template>
