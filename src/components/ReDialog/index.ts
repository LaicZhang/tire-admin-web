import reDialog from "./index.vue";
import { withInstall } from "@pureadmin/utils";
import {
  provideDialogStore,
  useDialogStore,
  DIALOG_STORE_KEY
} from "./useDialogStore";
import type {
  EventType,
  ArgsType,
  DialogProps,
  ButtonProps,
  DialogOptions
} from "./type";

/** 在下面这三处引入并注册，放心注册，不使用`addDialog`调用就不会被挂载
 * https://github.com/pure-admin/vue-pure-admin/blob/main/src/App.vue#L4
 * https://github.com/pure-admin/vue-pure-admin/blob/main/src/App.vue#L13
 * https://github.com/pure-admin/vue-pure-admin/blob/main/src/App.vue#L20
 */
const ReDialog = withInstall(reDialog);

export type { EventType, ArgsType, DialogProps, ButtonProps, DialogOptions };
export {
  ReDialog,
  // 新增：SSR 安全的 composable API
  provideDialogStore,
  useDialogStore,
  DIALOG_STORE_KEY
};
