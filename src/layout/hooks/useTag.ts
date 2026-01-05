import {
  ref,
  unref,
  computed,
  reactive,
  onMounted,
  type CSSProperties,
  getCurrentInstance,
  type ComponentInternalInstance
} from "vue";
import type { tagsViewsType } from "../types";
import { useRoute, useRouter } from "vue-router";
import { responsiveStorageNameSpace } from "@/config";
import { useSettingStoreHook } from "@/store/modules/settings";
import { useMultiTagsStoreHook } from "@/store/modules/multiTags";
import {
  isEqual,
  isBoolean,
  storageLocal,
  toggleClass,
  hasClass
} from "@pureadmin/utils";

import Fullscreen from "~icons/ri/fullscreen-fill";
import CloseAllTags from "~icons/ri/subtract-line";
import CloseOtherTags from "~icons/ri/text-spacing";
import CloseRightTags from "~icons/ri/text-direction-l";
import CloseLeftTags from "~icons/ri/text-direction-r";
import RefreshRight from "~icons/ep/refresh-right";
import Close from "~icons/ep/close";
import type { IconifyIcon } from "@iconify/vue";

export function useTags() {
  const route = useRoute();
  const router = useRouter();
  const instance = getCurrentInstance() as ComponentInternalInstance | null;
  const pureSetting = useSettingStoreHook();

  const buttonTop = ref(0);
  const buttonLeft = ref(0);
  const translateX = ref(0);
  const visible = ref(false);
  const activeIndex = ref(-1);
  // 当前右键选中的路由信息
  const currentSelect = ref({});
  const isScrolling = ref(false);

  /** 显示模式，默认灵动模式 */
  const showModel = ref(
    storageLocal().getItem<StorageConfigs>(
      `${responsiveStorageNameSpace()}configure`
    )?.showModel || "smart"
  );
  /** 是否隐藏标签页，默认显示 */
  const showTags = ref(
    storageLocal().getItem<StorageConfigs>(
      `${responsiveStorageNameSpace()}configure`
    )?.hideTabs ?? false
  );

  const multiTags = computed(
    () => useMultiTagsStoreHook().multiTags as unknown[]
  );

  const tagsViews = reactive<Array<tagsViewsType>>([
    {
      icon: RefreshRight as unknown as IconifyIcon,
      text: "重新加载",
      divided: false,
      disabled: false,
      show: true
    },
    {
      icon: Close as unknown as IconifyIcon,
      text: "关闭当前标签页",
      divided: false,
      disabled: multiTags.value.length > 1 ? false : true,
      show: true
    },
    {
      icon: CloseLeftTags as unknown as IconifyIcon,
      text: "关闭左侧标签页",
      divided: true,
      disabled: multiTags.value.length > 1 ? false : true,
      show: true
    },
    {
      icon: CloseRightTags as unknown as IconifyIcon,
      text: "关闭右侧标签页",
      divided: false,
      disabled: multiTags.value.length > 1 ? false : true,
      show: true
    },
    {
      icon: CloseOtherTags as unknown as IconifyIcon,
      text: "关闭其他标签页",
      divided: true,
      disabled: multiTags.value.length > 2 ? false : true,
      show: true
    },
    {
      icon: CloseAllTags as unknown as IconifyIcon,
      text: "关闭全部标签页",
      divided: false,
      disabled: multiTags.value.length > 1 ? false : true,
      show: true
    },
    {
      icon: Fullscreen as unknown as IconifyIcon,
      text: "内容区全屏",
      divided: true,
      disabled: false,
      show: true
    }
  ]);

  // Tag item can have various properties (path, query, params, meta, etc.)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  function conditionHandle(item: any, previous: unknown, next: unknown) {
    if (isBoolean(route?.meta?.showLink) && route?.meta?.showLink === false) {
      if (Object.keys(route.query).length > 0) {
        return isEqual(route.query, item.query) ? previous : next;
      } else {
        return isEqual(route.params, item.params) ? previous : next;
      }
    } else {
      return route.path === item.path ? previous : next;
    }
  }

  const iconIsActive = computed(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (item: any, index: number) => {
      if (index === 0) return;
      return conditionHandle(item, true, false);
    };
  });

  const linkIsActive = computed(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (item: any) => {
      return conditionHandle(item, "is-active", "");
    };
  });

  const scheduleIsActive = computed(() => {
    return (item: unknown) => {
      return conditionHandle(item, "schedule-active", "");
    };
  });

  const getTabStyle = computed((): CSSProperties => {
    return {
      transform: `translateX(${translateX.value}px)`,
      transition: isScrolling.value ? "none" : "transform 0.5s ease-in-out"
    };
  });

  const getContextMenuStyle = computed((): CSSProperties => {
    return { left: buttonLeft.value + "px", top: buttonTop.value + "px" };
  });

  const closeMenu = () => {
    visible.value = false;
  };

  const getRefEl = (key: string) => {
    // Vue refs array access
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (instance?.refs?.[key] as any)?.[0] as HTMLElement | undefined;
  };

  /** 鼠标移入添加激活样式 */
  function onMouseenter(index: number) {
    if (index) activeIndex.value = index;
    if (unref(showModel) === "smart") {
      const el = getRefEl(`schedule${index}`);
      if (!el) return;
      if (hasClass(el, "schedule-active")) return;
      toggleClass(true, "schedule-in", el);
      toggleClass(false, "schedule-out", el);
    } else {
      const el = getRefEl(`dynamic${index}`);
      if (!el) return;
      if (hasClass(el, "is-active")) return;
      toggleClass(true, "card-in", el);
      toggleClass(false, "card-out", el);
    }
  }

  /** 鼠标移出恢复默认样式 */
  function onMouseleave(index: number) {
    activeIndex.value = -1;
    if (unref(showModel) === "smart") {
      const el = getRefEl(`schedule${index}`);
      if (!el) return;
      if (hasClass(el, "schedule-active")) return;
      toggleClass(false, "schedule-in", el);
      toggleClass(true, "schedule-out", el);
    } else {
      const el = getRefEl(`dynamic${index}`);
      if (!el) return;
      if (hasClass(el, "is-active")) return;
      toggleClass(false, "card-in", el);
      toggleClass(true, "card-out", el);
    }
  }

  function onContentFullScreen() {
    pureSetting.hiddenSideBar
      ? pureSetting.changeSetting({ key: "hiddenSideBar", value: false })
      : pureSetting.changeSetting({ key: "hiddenSideBar", value: true });
  }

  onMounted(() => {
    if (!showModel.value) {
      const configure = storageLocal().getItem<StorageConfigs>(
        `${responsiveStorageNameSpace()}configure`
      );
      configure.showModel = "card";
      storageLocal().setItem(
        `${responsiveStorageNameSpace()}configure`,
        configure
      );
    }
  });

  return {
    Close,
    route,
    router,
    visible,
    showTags,
    instance,
    multiTags,
    showModel,
    tagsViews,
    buttonTop,
    buttonLeft,
    translateX,
    pureSetting,
    activeIndex,
    getTabStyle,
    isScrolling,
    iconIsActive,
    linkIsActive,
    currentSelect,
    scheduleIsActive,
    getContextMenuStyle,
    closeMenu,
    onMounted,
    onMouseenter,
    onMouseleave,
    onContentFullScreen
  };
}
