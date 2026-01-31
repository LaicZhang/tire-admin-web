import { defineAsyncComponent, type Component, h } from "vue";
import { logger } from "@/utils/logger";

export interface AsyncComponentOptions {
  /** 加载延迟时间（ms），超过此时间才显示 loading */
  delay?: number;
  /** 超时时间（ms） */
  timeout?: number;
  /** 加载失败时的重试次数 */
  retries?: number;
  /** 重试延迟时间（ms） */
  retryDelay?: number;
}

/**
 * 创建懒加载组件
 *
 * @description 带重试机制的组件懒加载工具
 *
 * @example
 * ```typescript
 * import { lazyComponent } from '@/utils/lazyComponent';
 *
 * // 基础用法
 * const HeavyChart = lazyComponent(() => import('./HeavyChart.vue'));
 *
 * // 带选项
 * const AsyncTable = lazyComponent(
 *   () => import('./AsyncTable.vue'),
 *   { delay: 200, timeout: 10000, retries: 3 }
 * );
 * ```
 */
export function lazyComponent(
  loader: () => Promise<Component | { default: Component }>,
  options: AsyncComponentOptions = {}
): Component {
  const {
    delay = 200,
    timeout = 30000,
    retries = 2,
    retryDelay = 1000
  } = options;

  // 带重试的加载器
  const retryLoader = async (): Promise<Component | { default: Component }> => {
    let lastError: Error | null = null;

    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        return await loader();
      } catch (error) {
        lastError = error as Error;
        if (attempt < retries) {
          // 等待后重试
          await new Promise(resolve => setTimeout(resolve, retryDelay));
          if (import.meta.env.DEV) {
            logger.warn(
              `[LazyComponent] 加载失败，${retryDelay}ms 后进行第 ${attempt + 1} 次重试`
            );
          }
        }
      }
    }

    throw lastError;
  };

  return defineAsyncComponent({
    loader: retryLoader,
    delay,
    timeout,
    // 加载中组件（简单的 skeleton）
    loadingComponent: {
      render() {
        return h("div", {
          class: "animate-pulse bg-gray-200 rounded h-32 w-full"
        });
      }
    },
    // 错误组件
    errorComponent: {
      props: ["error"],
      render() {
        return h(
          "div",
          {
            class: "text-red-500 p-4 text-center"
          },
          "组件加载失败，请刷新重试"
        );
      }
    },
    onError(error, retry, fail, attempts) {
      if (import.meta.env.DEV) {
        logger.error(`[LazyComponent] 加载失败 (尝试 ${attempts} 次):`, error);
      }
      // 超过重试次数后失败
      if (attempts > retries) {
        fail();
      } else {
        retry();
      }
    }
  });
}

/**
 * 预加载组件
 *
 * @description 在空闲时预加载组件，提升后续访问速度
 *
 * @example
 * ```typescript
 * import { preloadComponent } from '@/utils/lazyComponent';
 *
 * // 预加载可能用到的页面
 * preloadComponent(() => import('@/views/settings/index.vue'));
 * ```
 */
export function preloadComponent(
  loader: () => Promise<Component | { default: Component }>
): void {
  if (typeof window === "undefined") return;

  // 使用 requestIdleCallback 在空闲时预加载
  const preload = () => {
    loader().catch(() => {
      // 忽略预加载错误
    });
  };

  if ("requestIdleCallback" in window) {
    requestIdleCallback(preload, { timeout: 5000 });
  } else {
    setTimeout(preload, 2000);
  }
}

/**
 * 批量预加载组件
 */
export function preloadComponents(
  loaders: Array<() => Promise<Component | { default: Component }>>
): void {
  loaders.forEach(preloadComponent);
}
