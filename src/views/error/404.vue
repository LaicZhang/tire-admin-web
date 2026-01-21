<script setup lang="ts">
import ErrorPage from "./components/ErrorPage.vue";
import noExist from "@/assets/status/404.svg?component";

defineOptions({
  name: "404"
});
</script>

<template>
  <ErrorPage code="404" message="抱歉，你访问的页面不存在" :icon="noExist" />
</template>
