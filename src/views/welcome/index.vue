<script setup lang="ts">
import { onMounted, ref } from "vue";
import { getRoleHomeApi, type RoleDashboardData } from "@/api";
import { handleApiError } from "@/utils";
import RoleDashboardContent from "@/views/analysis/components/RoleDashboardContent.vue";

defineOptions({
  name: "Welcome"
});

const loading = ref(false);
const roleHome = ref<RoleDashboardData | null>(null);

async function loadRoleHome() {
  loading.value = true;
  try {
    const { code, data } = await getRoleHomeApi();
    if (code === 200 && data) {
      roleHome.value = data;
    }
  } catch (error) {
    handleApiError(error, "加载角色作战台失败");
  } finally {
    loading.value = false;
  }
}

onMounted(() => {
  void loadRoleHome();
});
</script>

<template>
  <div class="welcome-container p-1">
    <RoleDashboardContent :data="roleHome" :loading="loading" />
  </div>
</template>

<style lang="scss" scoped>
.welcome-container {
  max-width: 1600px;
  margin: 0 auto;
}
</style>
