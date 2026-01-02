import Axios, {
  type AxiosInstance,
  type AxiosRequestConfig,
  type CustomParamsSerializer,
  type AxiosError
} from "axios";
import type {
  PureHttpError,
  RequestMethods,
  PureHttpResponse,
  PureHttpRequestConfig
} from "./types.d";
import { stringify } from "qs";
import {
  getToken,
  formatToken,
  getCsrfToken,
  csrfHeaderName
} from "@/utils/auth";
import { useHttpOnlyCookie } from "@/utils/auth-config";
import { useUserStoreHook } from "@/store/modules/user";
import { ElMessage, ElMessageBox } from "element-plus";
import { resolveBaseURLFromViteEnv } from "./baseurl";

// 相关配置请参考：www.axios-js.com/zh-cn/docs/#axios-request-config-1
// 优先使用环境变量，其次：开发环境走相对路径配合 Vite 代理，生产环境兜底到公网 API
export { resolveBaseURLFromViteEnv } from "./baseurl";

let fatalApiConfigError: string | undefined;
let fatalApiConfigNotified = false;
const fatalApiConfigErrorCode = "ERR_FATAL_CONFIG";
const notifyFatalApiConfigOnce = () => {
  if (!fatalApiConfigError || fatalApiConfigNotified) return;
  fatalApiConfigNotified = true;

  // 保留排障信息（不依赖用户打开控制台）
  console.error(fatalApiConfigError);
  void ElMessageBox.alert(fatalApiConfigError, "配置错误", {
    type: "error",
    closeOnClickModal: false,
    closeOnPressEscape: false,
    confirmButtonText: "我知道了"
  }).catch(() => {
    // ignore
  });
};

const resolveBaseURL = (): string => {
  // Vite 注入的环境变量（仅在构建产物中可用）
  const env = import.meta.env as unknown as {
    VITE_SERVER_URL?: string;
    DEV: boolean;
    PROD: boolean;
  };
  const resolved = resolveBaseURLFromViteEnv(env);
  fatalApiConfigError = resolved.fatalError;
  if (fatalApiConfigError) queueMicrotask(notifyFatalApiConfigOnce);
  return resolved.baseURL;
};

/**
 * 判断是否应该重试请求
 * 仅对网络错误和幂等请求进行重试
 */
export const shouldRetry = (error: AxiosError): boolean => {
  if (error.code === fatalApiConfigErrorCode) return false;
  // 仅重试 GET/HEAD/OPTIONS 等幂等请求
  const idempotentMethods = ["get", "head", "options"];
  const method = error.config?.method?.toLowerCase() || "";
  if (!idempotentMethods.includes(method)) return false;

  // 网络错误或超时时重试
  return (
    !error.response ||
    error.code === "ECONNABORTED" ||
    error.code === "ERR_NETWORK" ||
    error.message.includes("timeout")
  );
};

/**
 * 指数退避延迟
 */
export const getRetryDelay = (retryCount: number): number => {
  return Math.min(1000 * Math.pow(2, retryCount), 10000);
};

/** 请求白名单：不需要 token 的接口（避免 refresh-token 请求再次触发 refresh 导致死循环） */
const authWhiteList = ["/api/auth/login", "/api/auth/refresh-token"];

const defaultConfig: AxiosRequestConfig = {
  baseURL: resolveBaseURL(),
  // 请求超时时间
  timeout: 10000,
  // HttpOnly Cookie 模式：发送 cookies 跨域
  withCredentials: useHttpOnlyCookie,
  headers: {
    Accept: "application/json, text/plain, */*",
    "Content-Type": "application/json",
    "X-Requested-With": "XMLHttpRequest"
  },
  // 数组格式参数序列化（https://github.com/axios/axios/issues/5142）
  paramsSerializer: {
    serialize: stringify as unknown as CustomParamsSerializer
  }
};

class PureHttp {
  constructor() {
    this.httpInterceptorsRequest();
    this.httpInterceptorsResponse();
  }

  /** token 过期后，暂存待执行的请求（保存 resolve/reject，避免 refresh 失败时请求挂起） */
  private static requests: Array<{
    config: PureHttpRequestConfig;
    resolve: (config: PureHttpRequestConfig) => void;
    reject: (error: unknown) => void;
  }> = [];

  /** 防止重复刷新token */
  private static isRefreshing = false;

  /** HttpOnly Cookie 模式：防止重复 refresh */
  private static isCookieRefreshing = false;

  /** HttpOnly Cookie 模式：暂存待重试的请求 */
  private static cookieRequests: Array<{
    config: PureHttpRequestConfig;
    resolve: (config: PureHttpRequestConfig) => void;
    reject: (error: unknown) => void;
  }> = [];

  /** 初始化配置对象 */
  private static initConfig: PureHttpRequestConfig = {};

  /** 保存当前Axios实例对象 */
  private static axiosInstance: AxiosInstance = Axios.create(defaultConfig);

  private static enqueueRequest(config: PureHttpRequestConfig) {
    return new Promise<PureHttpRequestConfig>((resolve, reject) => {
      PureHttp.requests.push({ config, resolve, reject });
    });
  }

  private static resolveRequests(token: string) {
    PureHttp.requests.forEach(({ config, resolve }) => {
      config.headers ??= {};
      config.headers["Authorization"] = formatToken(token);
      resolve(config);
    });
    PureHttp.requests = [];
  }

  private static rejectRequests(error: unknown) {
    PureHttp.requests.forEach(({ reject }) => reject(error));
    PureHttp.requests = [];
  }

  private static enqueueCookieRequest(config: PureHttpRequestConfig) {
    return new Promise<PureHttpRequestConfig>((resolve, reject) => {
      PureHttp.cookieRequests.push({ config, resolve, reject });
    });
  }

  private static resolveCookieRequests() {
    PureHttp.cookieRequests.forEach(({ config, resolve }) => resolve(config));
    PureHttp.cookieRequests = [];
  }

  private static rejectCookieRequests(error: unknown) {
    PureHttp.cookieRequests.forEach(({ reject }) => reject(error));
    PureHttp.cookieRequests = [];
  }

  /** 请求拦截 */
  private httpInterceptorsRequest(): void {
    PureHttp.axiosInstance.interceptors.request.use(
      async (config: PureHttpRequestConfig) => {
        if (fatalApiConfigError) {
          notifyFatalApiConfigOnce();
          const error = new Error(fatalApiConfigError) as Error & {
            code?: string;
          };
          error.code = fatalApiConfigErrorCode;
          return Promise.reject(error);
        }

        // 优先判断post/get等方法是否传入回调，否则执行初始化设置等回调
        if (typeof config.beforeRequestCallback === "function") {
          config.beforeRequestCallback(config);
          return config;
        }
        if (PureHttp.initConfig.beforeRequestCallback) {
          PureHttp.initConfig.beforeRequestCallback(config);
          return config;
        }
        // 跳过鉴权（登录/刷新等接口）
        if (config.skipAuth) return config;

        if (authWhiteList.includes(config.url ?? "")) return config;

        config.headers ??= {};

        // HttpOnly Cookie 模式：不发 Authorization header，添加 CSRF token
        if (useHttpOnlyCookie) {
          const method = config.method?.toLowerCase() ?? "get";
          // 非 GET/HEAD/OPTIONS 请求需要 CSRF token
          if (!["get", "head", "options"].includes(method)) {
            const csrfToken = getCsrfToken();
            if (csrfToken) {
              config.headers[csrfHeaderName] = csrfToken;
            }
          }
          return config;
        }

        // 传统模式：Bearer token
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
          useUserStoreHook().logOut();
          return Promise.reject(new Error("登录已过期，请重新登录"));
        }

        // Token 过期：将当前请求加入等待队列，等待刷新完成后重试
        if (!PureHttp.isRefreshing) {
          PureHttp.isRefreshing = true;
          useUserStoreHook()
            .handRefreshToken({ refreshToken: data.refreshToken })
            .then(res => {
              const token = res.data.accessToken;
              PureHttp.resolveRequests(token);
            })
            .catch(error => {
              PureHttp.rejectRequests(error);
              useUserStoreHook().logOut();
            })
            .finally(() => {
              PureHttp.isRefreshing = false;
            });
        }

        return PureHttp.enqueueRequest(config);
      },
      error => {
        return Promise.reject(error);
      }
    );
  }

  /** 响应拦截 */
  private httpInterceptorsResponse(): void {
    const instance = PureHttp.axiosInstance;
    instance.interceptors.response.use(
      (response: PureHttpResponse) => {
        const $config = response.config;
        // 优先判断post/get等方法是否传入回调，否则执行初始化设置等回调
        if (typeof $config.beforeResponseCallback === "function") {
          $config.beforeResponseCallback(response);
          return response.data;
        }
        if (PureHttp.initConfig.beforeResponseCallback) {
          PureHttp.initConfig.beforeResponseCallback(response);
          return response.data;
        }
        return response.data;
      },
      async (error: PureHttpError) => {
        const $error = error;
        $error.isCancelRequest = Axios.isCancel($error);

        const responseData = $error.response?.data as unknown;
        const isApiEnvelope = (
          value: unknown
        ): value is {
          code: number;
          msg: string;
          data?: unknown;
          meta?: unknown;
        } =>
          !!value &&
          typeof value === "object" &&
          "code" in value &&
          "msg" in value &&
          typeof (value as { code?: unknown }).code === "number" &&
          typeof (value as { msg?: unknown }).msg === "string";

        // HttpOnly Cookie 模式：401 自动 refresh 并重试（并发只 refresh 一次）
        const originalConfig = error.config as
          | (PureHttpRequestConfig & { __cookieAuthRetry?: boolean })
          | undefined;
        const status = $error.response?.status;
        if (
          useHttpOnlyCookie &&
          status === 401 &&
          originalConfig &&
          !originalConfig.skipAuth &&
          !authWhiteList.includes(originalConfig.url ?? "") &&
          !originalConfig.__cookieAuthRetry
        ) {
          originalConfig.__cookieAuthRetry = true;

          if (PureHttp.isCookieRefreshing) {
            return PureHttp.enqueueCookieRequest(originalConfig).then(config =>
              instance.request(config)
            );
          }

          PureHttp.isCookieRefreshing = true;
          try {
            await instance.request({
              method: "post",
              url: "/api/auth/refresh-token",
              skipAuth: true
            } as PureHttpRequestConfig);
            PureHttp.resolveCookieRequests();
            return instance.request(originalConfig);
          } catch (refreshError) {
            PureHttp.rejectCookieRequests(refreshError);
            useUserStoreHook().logOut();
            return Promise.reject(refreshError);
          } finally {
            PureHttp.isCookieRefreshing = false;
          }
        }

        // 重试逻辑：仅对网络错误和幂等请求进行重试
        const config = error.config as PureHttpRequestConfig & {
          __retryCount?: number;
        };
        if (config && shouldRetry(error as unknown as AxiosError)) {
          config.__retryCount = config.__retryCount || 0;
          if (config.__retryCount < 3) {
            config.__retryCount++;
            const delay = getRetryDelay(config.__retryCount);
            console.warn(
              `[HTTP] 请求失败，${delay}ms 后进行第 ${config.__retryCount} 次重试:`,
              config.url
            );
            await new Promise(resolve => setTimeout(resolve, delay));
            return instance.request(config);
          }
        }

        // 非取消请求时显示错误提示
        if (
          !$error.isCancelRequest &&
          $error.code !== fatalApiConfigErrorCode
        ) {
          if (isApiEnvelope(responseData)) {
            ElMessage.error(responseData.msg || "请求失败，请稍后重试");
            return Promise.resolve(responseData);
          }

          const response = $error.response as { data?: { msg?: string } };
          const message =
            response?.data?.msg || $error.message || "请求失败，请稍后重试";
          ElMessage.error(message);
        }

        if (isApiEnvelope(responseData)) return Promise.resolve(responseData);
        return Promise.reject($error);
      }
    );
  }

  /** 通用请求工具函数 */
  public request<T>(
    method: RequestMethods,
    url: string,
    param?: AxiosRequestConfig,
    axiosConfig?: PureHttpRequestConfig
  ): Promise<T> {
    const config = {
      method,
      url,
      ...param,
      ...axiosConfig
    } as PureHttpRequestConfig;

    // 单独处理自定义请求/响应回调
    return new Promise((resolve, reject) => {
      PureHttp.axiosInstance
        .request(config)
        .then((response: unknown) => {
          resolve(response as T);
        })
        .catch(error => {
          reject(error);
        });
    });
  }

  /** 单独抽离的post工具函数 */
  public post<T, P>(
    url: string,
    params?: AxiosRequestConfig<T>,
    config?: PureHttpRequestConfig
  ): Promise<P> {
    return this.request<P>("post", url, params, config);
  }

  /** 单独抽离的get工具函数 */
  public get<T, P>(
    url: string,
    params?: AxiosRequestConfig<T>,
    config?: PureHttpRequestConfig
  ): Promise<P> {
    return this.request<P>("get", url, params, config);
  }

  /** 单独抽离的patch工具函数 */
  public patch<T, P>(
    url: string,
    params?: AxiosRequestConfig<T>,
    config?: PureHttpRequestConfig
  ): Promise<P> {
    return this.request<P>("patch", url, params, config);
  }

  /** 单独抽离的delete工具函数 */
  public delete<T, P>(
    url: string,
    params?: AxiosRequestConfig<T>,
    config?: PureHttpRequestConfig
  ): Promise<P> {
    return this.request<P>("delete", url, params, config);
  }
}

export const http = new PureHttp();
