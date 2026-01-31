import { ref, provide, inject, type InjectionKey, type Ref } from "vue";
import type { DialogOptions } from "./type";
import { logger } from "@/utils/logger";

/** Dialog Store 注入键 */
export const DIALOG_STORE_KEY: InjectionKey<Ref<Array<DialogOptions>>> =
  Symbol("dialogStore");

/**
 * 在根组件中提供 dialog store
 * @description 用于 SSR 场景下隔离不同请求的状态
 * @example
 * ```ts
 * // App.vue
 * import { provideDialogStore } from '@/components/ReDialog/useDialogStore';
 *
 * setup() {
 *   provideDialogStore();
 * }
 * ```
 */
export function provideDialogStore(): Ref<Array<DialogOptions>> {
  const store = ref<Array<DialogOptions>>([]);
  provide(DIALOG_STORE_KEY, store);
  return store;
}

/**
 * 获取 dialog store
 * @description 优先使用 inject 获取的 store，回退到全局 store
 * @param fallbackStore 可选的回退 store（用于向后兼容）
 */
export function useDialogStore(
  fallbackStore?: Ref<Array<DialogOptions>>
): Ref<Array<DialogOptions>> {
  const injectedStore = inject(DIALOG_STORE_KEY, null);

  if (injectedStore) {
    return injectedStore;
  }

  // 回退到传入的全局 store（向后兼容）
  if (fallbackStore) {
    return fallbackStore;
  }

  // 最后回退：创建新的 ref（不推荐，仅用于独立使用场景）
  logger.warn(
    "[ReDialog] 未找到 dialog store，建议在根组件调用 provideDialogStore()"
  );
  return ref<Array<DialogOptions>>([]);
}
