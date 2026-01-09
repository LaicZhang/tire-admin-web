<script setup lang="ts">
import Footer from "./footer/index.vue";
import { useGlobal, isNumber } from "@pureadmin/utils";
import KeepAliveFrame from "./keepAliveFrame/index.vue";
import backTop from "@/assets/svg/back_top.svg?component";
import {
  h,
  ref,
  computed,
  Transition,
  defineComponent,
  type PropType
} from "vue";
import { usePermissionStoreHook } from "@/store/modules/permission";
import { useRouter, type RouteLocationNormalizedLoaded } from "vue-router";
import SkeletonPage from "@/components/SkeletonPage/index.vue";

const props = defineProps({
  fixedHeader: Boolean
});

const { $storage, $config } = useGlobal<GlobalPropertiesApi>();

// 路由加载状态
const router = useRouter();
const isRouteLoading = ref(false);
let loadingTimer: ReturnType<typeof setTimeout> | null = null;

// 获取路由的一级菜单路径
function getTopLevelPath(path: string): string {
  const segments = path.split("/").filter(Boolean);
  return segments.length > 0 ? `/${segments[0]}` : "/";
}

router.beforeEach((to, from) => {
  if (loadingTimer) {
    clearTimeout(loadingTimer);
  }
  // 只在跨一级菜单切换时显示骨架屏，二级菜单内部切换不触发
  const toTop = getTopLevelPath(to.path);
  const fromTop = getTopLevelPath(from.path);
  if (toTop !== fromTop || !from.name) {
    isRouteLoading.value = true;
  }
});

router.afterEach(() => {
  // 最小显示 200ms，避免闪烁
  loadingTimer = setTimeout(() => {
    isRouteLoading.value = false;
  }, 200);
});

const isKeepAlive = computed(() => {
  return $config?.KeepAlive;
});

const transitions = computed(() => {
  return (route: RouteLocationNormalizedLoaded) => {
    return route.meta.transition;
  };
});

const hideTabs = computed(() => {
  return $storage?.configure.hideTabs;
});

const hideFooter = computed(() => {
  return $storage?.configure.hideFooter;
});

const stretch = computed(() => {
  return $storage?.configure.stretch;
});

const layout = computed(() => {
  return $storage?.layout.layout === "vertical";
});

const getMainWidth = computed(() => {
  return isNumber(stretch.value)
    ? stretch.value + "px"
    : stretch.value
      ? "1440px"
      : "100%";
});

const getSectionStyle = computed(() => {
  return [
    hideTabs.value && layout.value ? "padding-top: 48px;" : "",
    !hideTabs.value && layout.value ? "padding-top: 81px;" : "",
    hideTabs.value && !layout.value ? "padding-top: 48px;" : "",
    !hideTabs.value && !layout.value ? "padding-top: 81px;" : "",
    props.fixedHeader
      ? ""
      : `padding-top: 0;${
          hideTabs.value
            ? "min-height: calc(100vh - 48px);"
            : "min-height: calc(100vh - 86px);"
        }`
  ];
});

const transitionMain = defineComponent({
  props: {
    route: {
      type: Object as PropType<RouteLocationNormalizedLoaded>,
      required: true
    }
  },
  render() {
    const transitionName =
      transitions.value(this.route)?.name || "fade-transform";
    const enterTransition = transitions.value(this.route)?.enterTransition;
    const leaveTransition = transitions.value(this.route)?.leaveTransition;
    return h(
      Transition,
      {
        name: enterTransition ? "pure-classes-transition" : transitionName,
        enterActiveClass: enterTransition
          ? `animate__animated ${enterTransition}`
          : undefined,
        leaveActiveClass: leaveTransition
          ? `animate__animated ${leaveTransition}`
          : undefined,
        mode: "out-in",
        appear: true
      },
      {
        default: () => [this.$slots.default?.()]
      }
    );
  }
});
</script>

<template>
  <section
    :class="[props.fixedHeader ? 'app-main' : 'app-main-nofixed-header']"
    :style="getSectionStyle"
  >
    <!-- 骨架屏加载状态 -->
    <SkeletonPage v-if="isRouteLoading" />
    <router-view v-else>
      <template #default="{ Component, route }">
        <KeepAliveFrame :currComp="Component" :currRoute="route">
          <template #default="{ Comp, fullPath, frameInfo }">
            <el-scrollbar
              v-if="props.fixedHeader"
              :wrap-style="{
                display: 'flex',
                'flex-wrap': 'wrap',
                'max-width': getMainWidth,
                margin: '0 auto',
                transition: 'all 300ms cubic-bezier(0.4, 0, 0.2, 1)'
              }"
              :view-style="{
                display: 'flex',
                flex: 'auto',
                overflow: 'hidden',
                'flex-direction': 'column'
              }"
            >
              <el-backtop
                title="回到顶部"
                target=".app-main .el-scrollbar__wrap"
              >
                <backTop />
              </el-backtop>
              <div class="grow">
                <transitionMain :route="route">
                  <keep-alive
                    v-if="isKeepAlive"
                    :include="usePermissionStoreHook().cachePageList"
                  >
                    <component
                      :is="Comp"
                      :key="fullPath"
                      :frameInfo="frameInfo"
                      class="main-content"
                    />
                  </keep-alive>
                  <component
                    :is="Comp"
                    v-else
                    :key="fullPath"
                    :frameInfo="frameInfo"
                    class="main-content"
                  />
                </transitionMain>
              </div>
              <Footer v-if="!hideFooter" />
            </el-scrollbar>
            <div v-else class="grow">
              <transitionMain :route="route">
                <keep-alive
                  v-if="isKeepAlive"
                  :include="usePermissionStoreHook().cachePageList"
                >
                  <component
                    :is="Comp"
                    :key="fullPath"
                    :frameInfo="frameInfo"
                    class="main-content"
                  />
                </keep-alive>
                <component
                  :is="Comp"
                  v-else
                  :key="fullPath"
                  :frameInfo="frameInfo"
                  class="main-content"
                />
              </transitionMain>
            </div>
          </template>
        </KeepAliveFrame>
      </template>
    </router-view>

    <!-- 页脚 -->
    <Footer v-if="!hideFooter && !props.fixedHeader" />
  </section>
</template>

<style scoped>
.app-main {
  position: relative;
  width: 100%;
  height: 100vh;
  overflow-x: hidden;
}

.app-main-nofixed-header {
  position: relative;
  display: flex;
  flex-direction: column;
  width: 100%;
}

.main-content {
  margin: 8px;
}
</style>
