<script setup lang="ts">
import ErrorPage from "./components/ErrorPage.vue";
import noServer from "@/assets/status/500.svg?component";

defineOptions({
  name: "500"
});
</script>

<template>
  <ErrorPage code="500" message="抱歉，服务器出错了" :icon="noServer" />
</template>
