/**
 * HttpOnly Cookie 认证拦截器
 * 处理 HttpOnly 模式下 401 自动 refresh 并重试
 */
import type { AxiosInstance } from "axios";
import type { PureHttpError, PureHttpRequestConfig } from "../types.d";
import type { createPendingQueue } from "../pending-queue";
import { useUserStoreHook } from "@/store/modules/user";
import { authWhiteList } from "./auth";

type CookieAuthConfig = PureHttpRequestConfig & { __cookieAuthRetry?: boolean };

export interface CookieAuthInterceptorOptions {
  pendingQueue: ReturnType<typeof createPendingQueue>;
  refreshUrl?: string;
  onLogout?: () => void;
}

export interface CookieAuthInterceptorState {
  isRefreshing: boolean;
}

/**
 * 创建 Cookie 认证响应拦截器
 */
export const createCookieAuthInterceptor = (
  options: CookieAuthInterceptorOptions
) => {
  const {
    pendingQueue,
    refreshUrl = "/api/auth/refresh-token",
    onLogout
  } = options;

  const state: CookieAuthInterceptorState = {
    isRefreshing: false
  };

  const responseErrorInterceptor = async (
    error: PureHttpError,
    instance: AxiosInstance
  ): Promise<unknown> => {
    const originalConfig = error.config as CookieAuthConfig | undefined;
    const status = error.response?.status;

    // 仅处理 401 且非白名单、非重试的请求
    if (
      status === 401 &&
      originalConfig &&
      !originalConfig.skipAuth &&
      !authWhiteList.includes(originalConfig.url ?? "") &&
      !originalConfig.__cookieAuthRetry
    ) {
      originalConfig.__cookieAuthRetry = true;

      // 并发请求时加入队列等待
      if (state.isRefreshing) {
        return pendingQueue
          .enqueue(originalConfig)
          .then(config => instance.request(config));
      }

      state.isRefreshing = true;

      try {
        await instance.request({
          method: "post",
          url: refreshUrl,
          skipAuth: true
        } as PureHttpRequestConfig);

        pendingQueue.resolveAll(config => config);
        return instance.request(originalConfig);
      } catch (refreshError) {
        pendingQueue.rejectAll(refreshError);
        (onLogout ?? (() => useUserStoreHook().logOut()))();
        return Promise.reject(refreshError);
      } finally {
        state.isRefreshing = false;
      }
    }

    return Promise.reject(error);
  };

  return {
    responseErrorInterceptor,
    state
  };
};

/**
 * 注册 Cookie 认证拦截器到 axios 实例
 */
export const registerCookieAuthInterceptor = (
  instance: AxiosInstance,
  options: CookieAuthInterceptorOptions
) => {
  const { responseErrorInterceptor } = createCookieAuthInterceptor(options);

  return instance.interceptors.response.use(
    response => response,
    error => responseErrorInterceptor(error, instance)
  );
};
