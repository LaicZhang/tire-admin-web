<script setup lang="ts">
import lastFeat from "./components/lastFeat.vue";
import initDict from "./components/initDict.vue";
defineOptions({
  name: "Welcome"
});
</script>

<template>
  <div class="m-1">
    <lastFeat />
    <initDict />
  </div>
</template>
