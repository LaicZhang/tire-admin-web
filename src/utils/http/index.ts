import Axios, {
  type AxiosInstance,
  type AxiosRequestConfig,
  type CustomParamsSerializer,
  type AxiosError,
  type InternalAxiosRequestConfig
} from "axios";
import type {
  PureHttpError,
  RequestMethods,
  PureHttpResponse,
  PureHttpRequestConfig
} from "./types.d";
import { stringify } from "qs";
import { httpLogger } from "@/utils/logger";
import { useHttpOnlyCookie } from "@/utils/auth-config";
import { useUserStoreHook } from "@/store/modules/user";
import { ElMessage, ElMessageBox } from "element-plus";
import { resolveBaseURLFromViteEnv } from "./baseurl";
import { createPendingQueue } from "./pending-queue";
import { ensureIdempotencyKey } from "./idempotency";
import {
  createCookieAuthInterceptor,
  createRetryInterceptor,
  registerAuthInterceptor,
  registerCsrfInterceptor
} from "./interceptors";

// 相关配置请参考：www.axios-js.com/zh-cn/docs/#axios-request-config-1
// 优先使用环境变量，其次：开发环境走相对路径配合 Vite 代理，生产环境兜底到公网 API
export { resolveBaseURLFromViteEnv } from "./baseurl";

let fatalApiConfigError: string | undefined;
let fatalApiConfigNotified = false;
const fatalApiConfigErrorCode = "ERR_FATAL_CONFIG";
const notifyFatalApiConfigOnce = () => {
  if (!fatalApiConfigError || fatalApiConfigNotified) return;
  fatalApiConfigNotified = true;

  // 保留排障信息（仅开发环境输出到控制台）
  if (import.meta.env.DEV) httpLogger.error(fatalApiConfigError);
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

  private static pendingQueue = createPendingQueue({
    maxSize: 100,
    timeoutMs: 15000,
    overflowMessage: "请求过多，请稍后重试",
    timeoutMessage: "请求等待超时，请重试"
  });

  private static cookiePendingQueue = createPendingQueue({
    maxSize: 100,
    timeoutMs: 15000,
    overflowMessage: "请求过多，请稍后重试",
    timeoutMessage: "请求等待超时，请重试"
  });

  /** 初始化配置对象 */
  private static initConfig: PureHttpRequestConfig = {};

  /** 保存当前Axios实例对象 */
  private static axiosInstance: AxiosInstance = Axios.create(defaultConfig);

  /** 请求拦截 */
  private httpInterceptorsRequest(): void {
    const instance = PureHttp.axiosInstance;

    instance.interceptors.request.use(
      async (config: InternalAxiosRequestConfig & PureHttpRequestConfig) => {
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
        ensureIdempotencyKey(config);
        return config;
      },
      error => {
        return Promise.reject(error);
      }
    );

    if (useHttpOnlyCookie) {
      registerCsrfInterceptor(instance);
    } else {
      registerAuthInterceptor(instance, {
        pendingQueue: PureHttp.pendingQueue,
        onLogout: () => useUserStoreHook().logOut()
      });
    }
  }

  /** 响应拦截 */
  private httpInterceptorsResponse(): void {
    const instance = PureHttp.axiosInstance;
    const cookieAuthInterceptor = createCookieAuthInterceptor({
      pendingQueue: PureHttp.cookiePendingQueue,
      onLogout: () => useUserStoreHook().logOut()
    });
    const retryInterceptor = createRetryInterceptor({
      excludeErrorCodes: [fatalApiConfigErrorCode]
    });

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
        let $error = error;
        $error.isCancelRequest = Axios.isCancel($error);

        try {
          return await cookieAuthInterceptor.responseErrorInterceptor(
            $error,
            instance
          );
        } catch (cookieError) {
          $error = cookieError as PureHttpError;
        }

        try {
          return await retryInterceptor.responseErrorInterceptor(
            $error,
            instance
          );
        } catch (retryError) {
          $error = retryError as PureHttpError;
        }

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
