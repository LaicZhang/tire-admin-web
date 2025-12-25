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
import { getToken, formatToken } from "@/utils/auth";
import { useUserStoreHook } from "@/store/modules/user";
import { ElMessage } from "element-plus";

// 相关配置请参考：www.axios-js.com/zh-cn/docs/#axios-request-config-1
// 优先使用环境变量，其次：开发环境走相对路径配合 Vite 代理，生产环境兜底到公网 API
const resolveBaseURL = (): string => {
  // Vite 注入的环境变量（仅在构建产物中可用）
  const { VITE_SERVER_URL, DEV, PROD } = import.meta.env as unknown as {
    VITE_SERVER_URL?: string;
    DEV: boolean;
    PROD: boolean;
  };

  // 开发环境：使用相对路径，通过 Vite proxy 将 /api 转发到后端
  if (DEV) return "";

  // 生产/预发：必须配置环境变量
  if (PROD && VITE_SERVER_URL) return VITE_SERVER_URL;

  // 生产环境未配置时输出错误并返回空字符串（请求会失败）
  if (PROD) {
    console.error("[HTTP] 生产环境必须配置 VITE_SERVER_URL 环境变量");
    return "";
  }

  return "";
};

/**
 * 判断是否应该重试请求
 * 仅对网络错误和幂等请求进行重试
 */
const shouldRetry = (error: AxiosError): boolean => {
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
const getRetryDelay = (retryCount: number): number => {
  return Math.min(1000 * Math.pow(2, retryCount), 10000);
};

const defaultConfig: AxiosRequestConfig = {
  baseURL: resolveBaseURL(),
  // 请求超时时间
  timeout: 10000,
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

  /** token过期后，暂存待执行的请求 */
  private static requests: Array<(token: string) => void> = [];

  /** 防止重复刷新token */
  private static isRefreshing = false;

  /** 初始化配置对象 */
  private static initConfig: PureHttpRequestConfig = {};

  /** 保存当前Axios实例对象 */
  private static axiosInstance: AxiosInstance = Axios.create(defaultConfig);

  /** 重连原始请求 */
  private static retryOriginalRequest(config: PureHttpRequestConfig) {
    return new Promise(resolve => {
      PureHttp.requests.push((token: string) => {
        config.headers ??= {};
        config.headers["Authorization"] = formatToken(token);
        resolve(config);
      });
    });
  }

  /** 请求拦截 */
  private httpInterceptorsRequest(): void {
    PureHttp.axiosInstance.interceptors.request.use(
      async (config: PureHttpRequestConfig): Promise<any> => {
        // 优先判断post/get等方法是否传入回调，否则执行初始化设置等回调
        if (typeof config.beforeRequestCallback === "function") {
          config.beforeRequestCallback(config);
          return config;
        }
        if (PureHttp.initConfig.beforeRequestCallback) {
          PureHttp.initConfig.beforeRequestCallback(config);
          return config;
        }
        /** 请求白名单，放置一些不需要token的接口（通过设置请求白名单，防止token过期后再请求造成的死循环问题） */
        const whiteList = ["/refresh-token", "/login"];
        return whiteList.find(url => url === config.url)
          ? config
          : new Promise(resolve => {
              const data = getToken();
              if (data) {
                const now = new Date().getTime(),
                  expired = parseInt(data.expires) - now <= 0;
                if (expired) {
                  // Token 已过期，将当前请求加入等待队列
                  // 无论是否正在刷新，都需要等待新 token
                  if (!PureHttp.isRefreshing) {
                    PureHttp.isRefreshing = true;
                    // token过期刷新
                    useUserStoreHook()
                      .handRefreshToken({ refreshToken: data.refreshToken })
                      .then(res => {
                        const token = res.data.accessToken;
                        // 通知所有等待的请求使用新 token
                        PureHttp.requests.forEach(cb => cb(token));
                        PureHttp.requests = [];
                      })
                      .catch(() => {
                        // Token 刷新失败，清空队列并登出
                        PureHttp.requests = [];
                        useUserStoreHook().logOut();
                      })
                      .finally(() => {
                        PureHttp.isRefreshing = false;
                      });
                  }
                  // 当前请求也加入等待队列，等待新 token
                  resolve(PureHttp.retryOriginalRequest(config));
                } else {
                  config.headers ??= {};
                  config.headers["Authorization"] = formatToken(
                    data.accessToken
                  );
                  resolve(config);
                }
              } else {
                resolve(config);
              }
            });
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
        if (!$error.isCancelRequest) {
          const response = $error.response as { data?: { msg?: string } };
          const message =
            response?.data?.msg || $error.message || "请求失败，请稍后重试";
          ElMessage.error(message);
        }
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
