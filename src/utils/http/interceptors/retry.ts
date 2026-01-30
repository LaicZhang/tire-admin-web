/**
 * 请求重试拦截器
 * 处理网络错误和幂等请求的自动重试
 */
import type { AxiosError, AxiosInstance } from "axios";
import type { PureHttpRequestConfig } from "../types.d";
import { httpLogger } from "@/utils/logger";

/** 幂等方法列表 */
const IDEMPOTENT_METHODS = ["get", "head", "options"];

/** 默认最大重试次数 */
const DEFAULT_MAX_RETRIES = 3;

export interface RetryInterceptorOptions {
  maxRetries?: number;
  /** 不应重试的错误码 */
  excludeErrorCodes?: string[];
}

type RetryConfig = PureHttpRequestConfig & { __retryCount?: number };

/**
 * 判断是否应该重试请求
 * 仅对网络错误和幂等请求进行重试
 */
export const shouldRetry = (
  error: AxiosError,
  excludeErrorCodes: string[] = []
): boolean => {
  if (excludeErrorCodes.includes(error.code ?? "")) return false;

  // 仅重试 GET/HEAD/OPTIONS 等幂等请求
  const method = error.config?.method?.toLowerCase() || "";
  if (!IDEMPOTENT_METHODS.includes(method)) return false;

  // 网络错误或超时时重试
  return (
    !error.response ||
    error.code === "ECONNABORTED" ||
    error.code === "ERR_NETWORK" ||
    error.message.includes("timeout")
  );
};

/**
 * 指数退避延迟计算
 */
export const getRetryDelay = (retryCount: number): number => {
  return Math.min(1000 * Math.pow(2, retryCount), 10000);
};

/**
 * 创建重试响应拦截器
 */
export const createRetryInterceptor = (
  options: RetryInterceptorOptions = {}
) => {
  const { maxRetries = DEFAULT_MAX_RETRIES, excludeErrorCodes = [] } = options;

  const responseErrorInterceptor = async (
    error: AxiosError,
    instance: AxiosInstance
  ): Promise<unknown> => {
    const config = error.config as RetryConfig | undefined;

    if (config && shouldRetry(error, excludeErrorCodes)) {
      config.__retryCount = config.__retryCount || 0;

      if (config.__retryCount < maxRetries) {
        config.__retryCount++;
        const delay = getRetryDelay(config.__retryCount);

        if (import.meta.env.DEV) {
          httpLogger.warn(
            `请求失败，${delay}ms 后进行第 ${config.__retryCount} 次重试:`,
            config.url
          );
        }

        await new Promise(resolve => setTimeout(resolve, delay));
        return instance.request(config);
      }
    }

    return Promise.reject(error);
  };

  return { responseErrorInterceptor };
};

/**
 * 注册重试拦截器到 axios 实例
 * 注意：此拦截器需要在响应错误处理链中调用
 */
export const registerRetryInterceptor = (
  instance: AxiosInstance,
  options: RetryInterceptorOptions = {}
) => {
  const { responseErrorInterceptor } = createRetryInterceptor(options);

  return instance.interceptors.response.use(
    response => response,
    error => responseErrorInterceptor(error, instance)
  );
};
