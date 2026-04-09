import App from "./App.vue";
import router from "./router";
import { setupStore } from "@/store";
import { getPlatformConfig } from "./config";
import { logger } from "@/utils/logger";
import { MotionPlugin } from "@vueuse/motion";
import { h, createApp, defineComponent, type Directive } from "vue";
import { useElementPlus } from "@/plugins/elementPlus";
import { injectResponsiveStorage } from "@/utils/responsive";
import "@/utils/globalPolyfills";
import { applySsoFromCurrentUrl } from "@/utils/sso";
import AppErrorFallback from "@/components/AppErrorFallback.vue";
import { formatRuntimeError, showRuntimeError } from "@/utils/runtimeError";
import { plugin as VueTippy } from "vue-tippy";

import Table from "@pureadmin/table";
import PureDescriptions from "@pureadmin/descriptions";

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

app.config.errorHandler = (error, _instance, info) => {
  const detail = formatRuntimeError(error, info);
  logger.critical("[App] unhandled runtime error", detail);
  showRuntimeError({
    kind: "render",
    title: "页面渲染异常",
    message: "当前页面发生异常，请返回上一页或刷新重试",
    detail
  });
};

function mountBootstrapFallback(error: unknown) {
  const detail = formatRuntimeError(error, "bootstrap");

  createApp(
    defineComponent({
      setup() {
        return () =>
          h(AppErrorFallback, {
            title: "应用启动失败",
            message: "应用初始化未完成，请刷新页面后重试",
            detail,
            showBack:
              typeof window !== "undefined" && window.history.length > 1,
            onBack: () => window.history.back(),
            onHome: () => window.location.assign("/"),
            onReload: () => window.location.reload()
          });
      }
    })
  ).mount("#app");
}

async function bootstrap() {
  try {
    if (applySsoFromCurrentUrl()) return;
    const platformConfig = await getPlatformConfig(app);

    injectResponsiveStorage(app, platformConfig);
    setupStore(app);
    app.use(router);
    app
      .use(MotionPlugin)
      .use(useElementPlus)
      .use(VueTippy, { defaultProps: { placement: "top", appendTo: "parent" } })
      .use(Table)
      .use(PureDescriptions);

    await router.isReady();
    app.mount("#app");
  } catch (error) {
    const detail = formatRuntimeError(error, "bootstrap");
    logger.critical("[App] bootstrap failed", detail);
    showRuntimeError({
      kind: "bootstrap",
      title: "应用启动失败",
      message: "应用初始化失败，请刷新页面后重试",
      detail
    });
    mountBootstrapFallback(error);
  }
}

void bootstrap();
