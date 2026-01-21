import type { PureHttpRequestConfig } from "./types.d";

type PendingQueueItem = {
  config: PureHttpRequestConfig;
  resolve: (config: PureHttpRequestConfig) => void;
  reject: (error: unknown) => void;
  timeoutId: ReturnType<typeof setTimeout> | null;
};

export interface PendingQueueOptions {
  maxSize: number;
  timeoutMs: number;
  overflowMessage?: string;
  timeoutMessage?: string;
}

export const createPendingQueue = (options: PendingQueueOptions) => {
  let items: PendingQueueItem[] = [];

  const remove = (item: PendingQueueItem) => {
    items = items.filter(i => i !== item);
  };

  const enqueue = (config: PureHttpRequestConfig) => {
    return new Promise<PureHttpRequestConfig>((resolve, reject) => {
      if (items.length >= options.maxSize) {
        reject(new Error(options.overflowMessage || "请求过多，请稍后重试"));
        return;
      }

      const item: PendingQueueItem = {
        config,
        resolve,
        reject,
        timeoutId: null
      };

      if (options.timeoutMs > 0) {
        item.timeoutId = setTimeout(() => {
          remove(item);
          reject(new Error(options.timeoutMessage || "请求等待超时，请重试"));
        }, options.timeoutMs);
      }

      items.push(item);
    });
  };

  const resolveAll = (
    mapConfig: (config: PureHttpRequestConfig) => PureHttpRequestConfig
  ) => {
    const current = items;
    items = [];
    current.forEach(item => {
      if (item.timeoutId) clearTimeout(item.timeoutId);
      item.resolve(mapConfig(item.config));
    });
  };

  const rejectAll = (error: unknown) => {
    const current = items;
    items = [];
    current.forEach(item => {
      if (item.timeoutId) clearTimeout(item.timeoutId);
      item.reject(error);
    });
  };

  const size = () => items.length;

  return {
    enqueue,
    resolveAll,
    rejectAll,
    size
  };
};
