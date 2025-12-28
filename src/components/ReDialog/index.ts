import { ref } from "vue";
import reDialog from "./index.vue";
import { useTimeoutFn } from "@vueuse/core";
import { withInstall } from "@pureadmin/utils";
import {
  provideDialogStore,
  useDialogStore,
  DIALOG_STORE_KEY
} from "./useDialogStore";

/** 对话框关闭动画延时 (ms) */
const DIALOG_CLOSE_DELAY = 200;
import type {
  EventType,
  ArgsType,
  DialogProps,
  ButtonProps,
  DialogOptions
} from "./type";

/**
 * 全局 dialog store
 * @deprecated 建议使用 provideDialogStore/useDialogStore 替代，以支持 SSR 场景
 */
const dialogStore = ref<Array<DialogOptions>>([]);

/** 打开弹框 */
const addDialog = (options: DialogOptions) => {
  const open = () =>
    dialogStore.value.push(Object.assign(options, { visible: true }));
  if (options?.openDelay) {
    useTimeoutFn(() => {
      open();
    }, options.openDelay);
  } else {
    open();
  }
};

/** 关闭弹框 */
const closeDialog = (
  options: DialogOptions,
  index: number,
  args?: ArgsType
) => {
  dialogStore.value[index].visible = false;
  options.closeCallBack &&
    options.closeCallBack({
      options,
      index,
      args: args ?? { command: "close" }
    });
  useTimeoutFn(() => {
    dialogStore.value.splice(index, 1);
  }, DIALOG_CLOSE_DELAY);
};

/**
 * @description 更改弹框自身属性值
 * @param value 属性值
 * @param key 属性，默认`title`
 * @param index 弹框索引（默认`0`，代表只有一个弹框，对于嵌套弹框要改哪个弹框的属性值就把该弹框索引赋给`index`）
 */
const updateDialog = <K extends keyof DialogOptions>(
  value: DialogOptions[K],
  key: K = "title" as K,
  index = 0
) => {
  dialogStore.value[index][key] = value;
};

/** 关闭所有弹框 */
const closeAllDialog = () => {
  dialogStore.value = [];
};

/** 在下面这三处引入并注册，放心注册，不使用`addDialog`调用就不会被挂载
 * https://github.com/pure-admin/vue-pure-admin/blob/main/src/App.vue#L4
 * https://github.com/pure-admin/vue-pure-admin/blob/main/src/App.vue#L13
 * https://github.com/pure-admin/vue-pure-admin/blob/main/src/App.vue#L20
 */
const ReDialog = withInstall(reDialog);

export type { EventType, ArgsType, DialogProps, ButtonProps, DialogOptions };
export {
  ReDialog,
  dialogStore,
  addDialog,
  closeDialog,
  updateDialog,
  closeAllDialog,
  // 新增：SSR 安全的 composable API
  provideDialogStore,
  useDialogStore,
  DIALOG_STORE_KEY
};
