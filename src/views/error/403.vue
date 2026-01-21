<script setup lang="ts">
import ErrorPage from "./components/ErrorPage.vue";
import noAccess from "@/assets/status/403.svg?component";

defineOptions({
  name: "403"
});
</script>

<template>
  <ErrorPage code="403" message="抱歉，你无权访问该页面" :icon="noAccess" />
</template>
