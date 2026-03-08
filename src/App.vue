<template>
  <!-- <el-config-provider :locale="currentLocale"> -->
  <el-config-provider>
    <AppErrorFallback
      v-if="runtimeError.visible"
      :title="runtimeError.title"
      :message="runtimeError.message"
      :detail="runtimeError.detail"
      :show-back="canGoBack"
      @back="handleBack"
      @home="handleHome"
      @reload="handleReload"
    />
    <template v-else>
      <router-view />
      <ReDialog />
    </template>
  </el-config-provider>
</template>

<script lang="ts">
import { computed, defineComponent, onErrorCaptured } from "vue";
import { ElConfigProvider } from "element-plus";
// import zhCn from "element-plus/dist/locale/zh-cn.mjs";
import { useRouter } from "vue-router";
import { ReDialog } from "@/components/ReDialog";
import AppErrorFallback from "@/components/AppErrorFallback.vue";
import {
  clearRuntimeError,
  formatRuntimeError,
  showRuntimeError,
  useRuntimeErrorState
} from "@/utils/runtimeError";
import { resolveSafeHomeRoute, safeNavigate } from "@/router/utils";

export default defineComponent({
  name: "app",
  components: {
    ElConfigProvider,
    ReDialog,
    AppErrorFallback
  },
  setup() {
    const router = useRouter();
    const runtimeError = useRuntimeErrorState();
    const canGoBack = computed(() => window.history.length > 1);

    function handleReload() {
      clearRuntimeError();
      window.location.reload();
    }

    function handleBack() {
      clearRuntimeError();
      if (window.history.length > 1) {
        router.back();
        return;
      }
      void safeNavigate(router, resolveSafeHomeRoute(router), {
        replace: true,
        silent: true,
        fallback: { path: "/login" }
      });
    }

    function handleHome() {
      clearRuntimeError();
      void safeNavigate(router, resolveSafeHomeRoute(router), {
        replace: true,
        silent: true,
        fallback: { path: "/login" }
      });
    }

    onErrorCaptured((error, _instance, info) => {
      showRuntimeError({
        kind: "render",
        title: "页面渲染异常",
        message: "当前页面加载失败，请返回上一页或刷新重试",
        detail: formatRuntimeError(error, info)
      });
      return false;
    });

    return {
      runtimeError,
      canGoBack,
      handleBack,
      handleHome,
      handleReload
    };
  }
  // computed: {
  //   currentLocale() {
  //     return zhCn;
  //   }
  // }
});
</script>
