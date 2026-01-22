/**
 * Bearer Token 认证拦截器
 * 处理 token 验证、刷新逻辑、白名单检查
 */
import type { AxiosInstance } from "axios";
import type { PureHttpRequestConfig } from "../types.d";
import type { createPendingQueue } from "../pending-queue";
import { getToken, formatToken } from "@/utils/auth";
import { useUserStoreHook } from "@/store/modules/user";

/** 请求白名单：不需要 token 的接口 */
export const authWhiteList = ["/api/auth/login", "/api/auth/refresh-token"];

export interface AuthInterceptorOptions {
  pendingQueue: ReturnType<typeof createPendingQueue>;
  onLogout?: () => void;
}

export interface AuthInterceptorState {
  isRefreshing: boolean;
}

/**
 * 创建 Bearer Token 认证请求拦截器
 */
export const createAuthInterceptor = (options: AuthInterceptorOptions) => {
  const state: AuthInterceptorState = {
    isRefreshing: false
  };

  const requestInterceptor = async (
    config: PureHttpRequestConfig
  ): Promise<PureHttpRequestConfig> => {
    // 跳过鉴权（登录/刷新等接口）
    if (config.skipAuth) return config;
    if (authWhiteList.includes(config.url ?? "")) return config;

    config.headers ??= {};

    const data = getToken();
    if (!data?.accessToken) return config;

    const expires = Number(data.expires);
    const expired = expires <= Date.now();

    if (!expired) {
      config.headers["Authorization"] = formatToken(data.accessToken);
      return config;
    }

    // accessToken 已过期，但 refreshToken 不存在：直接登出并快速失败
    if (!data.refreshToken) {
      (options.onLogout ?? (() => useUserStoreHook().logOut()))();
      return Promise.reject(new Error("登录已过期，请重新登录"));
    }

    // Token 过期：将当前请求加入等待队列，等待刷新完成后重试
    if (!state.isRefreshing) {
      state.isRefreshing = true;
      useUserStoreHook()
        .handRefreshToken({ refreshToken: data.refreshToken })
        .then(res => {
          const token = res.data.accessToken;
          options.pendingQueue.resolveAll(pendingConfig => {
            pendingConfig.headers ??= {};
            pendingConfig.headers["Authorization"] = formatToken(token);
            return pendingConfig;
          });
        })
        .catch(error => {
          options.pendingQueue.rejectAll(error);
          (options.onLogout ?? (() => useUserStoreHook().logOut()))();
        })
        .finally(() => {
          state.isRefreshing = false;
        });
    }

    return options.pendingQueue.enqueue(config);
  };

  return {
    requestInterceptor,
    state
  };
};

/**
 * 注册 Bearer Token 认证拦截器到 axios 实例
 */
export const registerAuthInterceptor = (
  instance: AxiosInstance,
  options: AuthInterceptorOptions
) => {
  const { requestInterceptor } = createAuthInterceptor(options);

  return instance.interceptors.request.use(
    // @ts-expect-error PureHttpRequestConfig extends InternalAxiosRequestConfig
    requestInterceptor,
    error => Promise.reject(error)
  );
};
