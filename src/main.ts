import App from "./App.vue";
import router from "./router";
import { setupStore } from "@/store";
import { getConfig, getPlatformConfig } from "./config";
import { MotionPlugin } from "@vueuse/motion";
import { createApp, type Directive } from "vue";
import { useElementPlus } from "@/plugins/elementPlus";
import { injectResponsiveStorage } from "@/utils/responsive";
import "@/utils/globalPolyfills";

import Table from "@pureadmin/table";
import PureDescriptions from "@pureadmin/descriptions";
import { useAppStoreHook } from "@/store/modules/app";
import { useSettingStoreHook } from "@/store/modules/settings";
import { useEpThemeStoreHook } from "@/store/modules/epTheme";

// 引入重置样式
import "./style/reset.scss";
// @pureadmin/table 内部使用了 el-table / el-pagination 等组件，需显式引入其样式，避免被全局 reset 影响导致显示异常
import "@pureadmin/table/dist/style.css";
// 导入公共样式
import "./style/index.scss";
// 一定要在main.ts中导入tailwind.css，防止vite每次hmr都会请求src/style/index.scss整体css文件导致热更新慢的问题
import "./style/tailwind.css";
// Element Plus 样式通过 unplugin-vue-components 按需导入
// 导入字体图标
import "./assets/iconfont/iconfont.js";
import "./assets/iconfont/iconfont.css";

const app = createApp(App);

// 自定义指令
import * as directives from "@/directives";
Object.keys(directives).forEach(key => {
  app.directive(key, (directives as { [key: string]: Directive })[key]);
});

// 全局注册@iconify/vue图标库
import { IconifyIconOffline } from "./components/ReIcon";
app.component("IconifyIconOffline", IconifyIconOffline);

const bootConfig = Object.assign({}, getConfig<PlatformConfigs>());
app.config.globalProperties.$config = bootConfig;
injectResponsiveStorage(app, bootConfig);

setupStore(app);
app.use(router);
app.use(MotionPlugin).use(useElementPlus).use(Table).use(PureDescriptions);

router.isReady().then(() => {
  app.mount("#app");
});

function applyPlatformConfigAfterLoad(
  initial: PlatformConfigs,
  latest: PlatformConfigs
) {
  const settingStore = useSettingStoreHook();
  if (settingStore.title === (initial.Title ?? "")) {
    settingStore.changeSetting({ key: "title", value: latest.Title ?? "" });
  }
  if (settingStore.fixedHeader === (initial.FixedHeader ?? false)) {
    settingStore.changeSetting({
      key: "fixedHeader",
      value: latest.FixedHeader ?? false
    });
  }
  if (settingStore.hiddenSideBar === (initial.HiddenSideBar ?? false)) {
    settingStore.changeSetting({
      key: "hiddenSideBar",
      value: latest.HiddenSideBar ?? false
    });
  }

  const appStore = useAppStoreHook();
  if (appStore.layout === (initial.Layout ?? "vertical")) {
    appStore.setLayout(latest.Layout ?? "vertical");
  }
  if (appStore.sidebar.opened === (initial.SidebarStatus ?? true)) {
    appStore.sidebar.opened = latest.SidebarStatus ?? true;
  }

  const epThemeStore = useEpThemeStoreHook();
  if (epThemeStore.epThemeColor === (initial.EpThemeColor ?? "#409EFF")) {
    epThemeStore.setEpThemeColor(latest.EpThemeColor ?? "#409EFF");
  }

  const currentRoute = router.currentRoute.value;
  const routeTitle = currentRoute?.meta?.title as string | undefined;
  if (routeTitle) {
    const appTitle = latest.Title;
    document.title = appTitle ? `${routeTitle} | ${appTitle}` : routeTitle;
  }
}

void getPlatformConfig(app).then(latest => {
  applyPlatformConfigAfterLoad(bootConfig, latest);
});
