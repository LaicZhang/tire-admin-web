// Element Plus 插件导入（仅保留需要全局注册的指令和 Message 相关插件）
import type { App } from "vue";
import {
  ElLoading, // v-loading 指令
  ElInfiniteScroll, // v-infinite-scroll 指令
  ElPopoverDirective // v-popover 指令
} from "element-plus";

/** Element Plus 插件（组件已通过 unplugin-vue-components 自动按需导入） */
export function useElementPlus(app: App) {
  // 全局注册指令插件
  app.use(ElLoading);
  app.use(ElInfiniteScroll);
  app.use(ElPopoverDirective);
}
