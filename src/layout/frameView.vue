<script setup lang="ts">
import { useRoute } from "vue-router";
import { ref, unref, watch, onMounted, nextTick } from "vue";

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
const frameSrc = ref<string>("");
const frameRef = ref<HTMLElement | null>(null);
const fallbackTimer = ref<number | null>(null);

if (unref(currentRoute.meta)?.frameSrc) {
  frameSrc.value = unref(currentRoute.meta)?.frameSrc as string;
}
// unref(currentRoute.meta)?.frameLoading === false && hideLoading();

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
    const _frame = iframe as any;
    if (_frame.attachEvent) {
      _frame.attachEvent("onload", hideLoading);
    } else {
      iframe.onload = hideLoading;
    }
  });
}

let isRedirect = false;

watch(
  () => currentRoute.fullPath,
  path => {
    const frameInfo = props.frameInfo;
    if (
      currentRoute.name === "Redirect" &&
      frameInfo?.fullPath &&
      path.includes(frameInfo.fullPath)
    ) {
      // frameSrc.value = path; // redirect时，置换成任意值，待重定向后 重新赋值
      isRedirect = true;
      loading.value = true;
      return;
    }
    // 重新赋值
    // if (props.frameInfo?.fullPath === path) {
    //   frameSrc.value = props.frameInfo?.frameSrc;
    // }
    if (frameInfo?.fullPath === path && isRedirect) {
      loading.value = true;
      clearFallbackTimer();
      const src = frameInfo.frameSrc;
      if (!src) return;
      const url = new URL(src, window.location.origin);
      const joinChar = url.search ? "&" : "?";
      frameSrc.value = `${src}${joinChar}t=${Date.now()}`;
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

onMounted(() => {
  init();
});
</script>

<template>
  <div v-loading="loading" class="frame" element-loading-text="加载中...">
    <iframe ref="frameRef" :src="frameSrc" class="frame-iframe" />
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
}

.main-content {
  margin: 2px 0 0 !important;
}
</style>
