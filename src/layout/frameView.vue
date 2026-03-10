<script setup lang="ts">
import { useRoute } from "vue-router";
import {
  computed,
  ref,
  unref,
  watch,
  onMounted,
  onBeforeUnmount,
  nextTick
} from "vue";
import {
  DEFAULT_IFRAME_REFERRER_POLICY,
  DEFAULT_IFRAME_SANDBOX,
  resolveTrustedFrameSrc,
  withFrameCacheBust
} from "@/utils/frame";

defineOptions({
  name: "FrameView"
});

const props = defineProps<{
  frameInfo?: {
    frameSrc?: string;
    fullPath?: string;
  };
}>();

const loading = ref(true);
const currentRoute = useRoute();
const rawFrameSrc = ref<string>("");
const frameRef = ref<HTMLElement | null>(null);
const fallbackTimer = ref<number | null>(null);
const frameState = computed(() => resolveTrustedFrameSrc(rawFrameSrc.value));
const trustedFrameSrc = computed(() =>
  frameState.value.trusted ? frameState.value.src : ""
);
const blockedReason = computed(() =>
  frameState.value.trusted ? "" : frameState.value.reason
);

function clearFallbackTimer() {
  if (fallbackTimer.value !== null) {
    clearTimeout(fallbackTimer.value);
    fallbackTimer.value = null;
  }
}
function hideLoading() {
  loading.value = false;
}

function init() {
  nextTick(() => {
    const iframe = unref(frameRef);
    if (!iframe) return;
    // Legacy IE support with proper typing
    const _frame = iframe as HTMLIFrameElement & {
      attachEvent?: (event: string, listener: () => void) => void;
    };
    if (_frame.attachEvent) {
      _frame.attachEvent("onload", hideLoading);
    } else {
      iframe.onload = hideLoading;
    }
  });
}

let isRedirect = false;

watch(
  () => props.frameInfo?.frameSrc,
  src => {
    if (src) {
      rawFrameSrc.value = src;
    }
  },
  { immediate: true }
);

watch(
  () => currentRoute.meta?.frameSrc,
  src => {
    if (typeof src === "string" && src) {
      rawFrameSrc.value = src;
    }
  },
  { immediate: true }
);

watch(
  () => currentRoute.fullPath,
  path => {
    const frameInfo = props.frameInfo;
    if (
      currentRoute.name === "Redirect" &&
      frameInfo?.fullPath &&
      path.includes(frameInfo.fullPath)
    ) {
      isRedirect = true;
      loading.value = true;
      return;
    }
    if (frameInfo?.fullPath === path && isRedirect) {
      loading.value = true;
      clearFallbackTimer();
      const src = frameInfo.frameSrc;
      if (!src) return;
      rawFrameSrc.value = withFrameCacheBust(src);
      fallbackTimer.value = window.setTimeout(() => {
        if (loading.value) {
          hideLoading();
        }
      }, 1500);
      isRedirect = false;
    }
  },
  { immediate: true }
);

watch(
  trustedFrameSrc,
  src => {
    clearFallbackTimer();
    if (!src) {
      loading.value = false;
      return;
    }
    loading.value = true;
    init();
  },
  { immediate: true }
);

onMounted(() => {
  init();
});

onBeforeUnmount(() => {
  clearFallbackTimer();
});
</script>

<template>
  <div
    v-loading="loading && !!trustedFrameSrc"
    class="frame"
    element-loading-text="加载中..."
  >
    <iframe
      v-if="trustedFrameSrc"
      ref="frameRef"
      :src="trustedFrameSrc"
      :sandbox="DEFAULT_IFRAME_SANDBOX"
      :referrerpolicy="DEFAULT_IFRAME_REFERRER_POLICY"
      class="frame-iframe"
    />
    <el-result
      v-else
      icon="warning"
      title="嵌入内容已拦截"
      :sub-title="blockedReason || '当前链接不在受信任范围内'"
      class="frame-result"
    />
  </div>
</template>

<style lang="scss" scoped>
.frame {
  position: relative;
  width: 100%;
  height: 100%;
  min-height: calc(100vh - 120px);

  .frame-iframe {
    box-sizing: border-box;
    width: 100%;
    height: 100%;
    overflow: hidden;
    border: 0;
  }

  .frame-result {
    display: flex;
    align-items: center;
    justify-content: center;
    height: 100%;
  }
}

.main-content {
  margin: 2px 0 0 !important;
}
</style>
