/**
 * CSRF Token 拦截器
 * 处理 HttpOnly Cookie 模式的 CSRF token 注入
 */
import type { AxiosInstance } from "axios";
import type { PureHttpRequestConfig } from "../types.d";
import { getCsrfToken, csrfHeaderName } from "@/utils/auth";

/** 不需要 CSRF token 的幂等方法 */
const SAFE_METHODS = ["get", "head", "options"];

/**
 * 创建 CSRF 请求拦截器
 */
export const createCsrfInterceptor = () => {
  const requestInterceptor = (
    config: PureHttpRequestConfig
  ): PureHttpRequestConfig => {
    config.headers ??= {};

    const method = config.method?.toLowerCase() ?? "get";

    // 非 GET/HEAD/OPTIONS 请求需要 CSRF token
    if (!SAFE_METHODS.includes(method)) {
      const csrfToken = getCsrfToken();
      if (csrfToken) {
        config.headers[csrfHeaderName] = csrfToken;
      }
    }

    return config;
  };

  return { requestInterceptor };
};

/**
 * 注册 CSRF 拦截器到 axios 实例
 */
export const registerCsrfInterceptor = (instance: AxiosInstance) => {
  const { requestInterceptor } = createCsrfInterceptor();

  return instance.interceptors.request.use(
    // @ts-expect-error PureHttpRequestConfig extends InternalAxiosRequestConfig
    requestInterceptor,
    error => Promise.reject(error)
  );
};
