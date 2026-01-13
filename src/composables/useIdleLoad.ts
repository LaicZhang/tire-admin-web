import { onMounted, onUnmounted } from "vue";

/**
 * 使用 requestIdleCallback 延迟执行非关键任务
 * 用于优化首屏性能，将非关键数据加载延迟到浏览器空闲时执行
 *
 * @param callback - 要延迟执行的回调函数
 * @param options - 配置选项
 * @param options.timeout - 最大等待时间（毫秒），超时后强制执行，默认 2000ms
 * @param options.immediate - 是否在 onMounted 时自动执行，默认 true
 *
 * @example
 * ```ts
 * // 基础用法 - 自动延迟加载
 * useIdleLoad(() => {
 *   loadNonCriticalData();
 * });
 *
 * // 带超时配置
 * useIdleLoad(() => {
 *   loadAnalyticsData();
 * }, { timeout: 5000 });
 *
 * // 手动控制执行
 * const { execute, cancel } = useIdleLoad(() => {
 *   loadData();
 * }, { immediate: false });
 *
 * // 稍后手动触发
 * execute();
 * ```
 */
export function useIdleLoad(
  callback: () => void | Promise<void>,
  options: {
    timeout?: number;
    immediate?: boolean;
  } = {}
) {
  const { timeout = 2000, immediate = true } = options;

  let idleCallbackId: number | null = null;
  let timeoutId: ReturnType<typeof setTimeout> | null = null;
  let isExecuted = false;

  const execute = () => {
    if (isExecuted) return;

    if ("requestIdleCallback" in window) {
      idleCallbackId = window.requestIdleCallback(
        () => {
          if (!isExecuted) {
            isExecuted = true;
            callback();
          }
        },
        { timeout }
      );
    } else {
      // Fallback for browsers that don't support requestIdleCallback
      timeoutId = setTimeout(() => {
        if (!isExecuted) {
          isExecuted = true;
          callback();
        }
      }, 100);
    }
  };

  const cancel = () => {
    if (idleCallbackId !== null && "cancelIdleCallback" in window) {
      window.cancelIdleCallback(idleCallbackId);
      idleCallbackId = null;
    }
    if (timeoutId !== null) {
      clearTimeout(timeoutId);
      timeoutId = null;
    }
  };

  if (immediate) {
    onMounted(execute);
  }

  onUnmounted(cancel);

  return {
    execute,
    cancel,
    get isExecuted() {
      return isExecuted;
    }
  };
}

/**
 * 批量延迟加载多个任务
 * 任务按顺序在浏览器空闲时依次执行
 *
 * @param tasks - 任务数组
 * @param options - 配置选项
 *
 * @example
 * ```ts
 * useIdleLoadBatch([
 *   () => loadUserPreferences(),
 *   () => loadNotifications(),
 *   () => loadAnalytics()
 * ]);
 * ```
 */
export function useIdleLoadBatch(
  tasks: Array<() => void | Promise<void>>,
  options: { timeout?: number } = {}
) {
  const { timeout = 2000 } = options;

  let currentIndex = 0;
  let idleCallbackId: number | null = null;

  const executeNext = () => {
    if (currentIndex >= tasks.length) return;

    const task = tasks[currentIndex];
    currentIndex++;

    if ("requestIdleCallback" in window) {
      idleCallbackId = window.requestIdleCallback(
        async deadline => {
          await task();
          if (deadline.timeRemaining() > 0 || deadline.didTimeout) {
            executeNext();
          } else {
            // Schedule next task for next idle period
            executeNext();
          }
        },
        { timeout }
      );
    } else {
      setTimeout(async () => {
        await task();
        executeNext();
      }, 50);
    }
  };

  const cancel = () => {
    if (idleCallbackId !== null && "cancelIdleCallback" in window) {
      window.cancelIdleCallback(idleCallbackId);
    }
  };

  onMounted(executeNext);
  onUnmounted(cancel);

  return { cancel };
}
