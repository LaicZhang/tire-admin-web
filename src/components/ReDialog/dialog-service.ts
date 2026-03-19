import { ref, type Ref } from "vue";
import { useTimeoutFn } from "@vueuse/core";
import type { ArgsType, DialogOptions } from "./type";

/** 对话框关闭动画延时 (ms) */
const DIALOG_CLOSE_DELAY = 200;

const globalDialogStore = ref<Array<DialogOptions>>([]);

export function getGlobalDialogStore(): Ref<Array<DialogOptions>> {
  return globalDialogStore;
}

export function addDialog(
  options: DialogOptions,
  store: Ref<Array<DialogOptions>> = globalDialogStore
) {
  const open = () =>
    store.value.push(Object.assign(options, { visible: true }));
  if (options?.openDelay) {
    useTimeoutFn(() => {
      open();
    }, options.openDelay);
    return;
  }
  open();
}

export function closeDialog(
  options: DialogOptions,
  index: number,
  args?: ArgsType,
  store: Ref<Array<DialogOptions>> = globalDialogStore
) {
  store.value[index].visible = false;
  options.closeCallBack &&
    options.closeCallBack({
      options,
      index,
      args: args ?? { command: "close" }
    });
  useTimeoutFn(() => {
    store.value.splice(index, 1);
  }, DIALOG_CLOSE_DELAY);
}

export function updateDialog<K extends keyof DialogOptions>(
  value: DialogOptions[K],
  key: K = "title" as K,
  index = 0,
  store: Ref<Array<DialogOptions>> = globalDialogStore
) {
  store.value[index][key] = value;
}

export function closeAllDialog(
  store: Ref<Array<DialogOptions>> = globalDialogStore
) {
  store.value = [];
}
