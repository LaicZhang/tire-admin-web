/**
 * HTTP 工具类型定义
 */
import type {
  Method,
  AxiosError,
  AxiosResponse,
  AxiosRequestConfig
} from "axios";

/**
 * Token 结果类型
 */
export type ResultType = {
  accessToken?: string;
};

/**
 * 支持的 HTTP 请求方法
 */
export type RequestMethods = Extract<
  Method,
  "get" | "post" | "put" | "delete" | "patch" | "option" | "head"
>;

/**
 * HTTP 错误扩展类型
 */
export interface PureHttpError extends AxiosError {
  /** 是否为取消请求 */
  isCancelRequest?: boolean;
}

/**
 * HTTP 响应扩展类型
 */
export interface PureHttpResponse extends AxiosResponse {
  config: PureHttpRequestConfig;
}

/**
 * HTTP 请求配置扩展类型
 */
export interface PureHttpRequestConfig extends AxiosRequestConfig {
  /** 请求前回调 */
  beforeRequestCallback?: (request: PureHttpRequestConfig) => void;
  /** 响应前回调 */
  beforeResponseCallback?: (response: PureHttpResponse) => void;
  /** 跳过鉴权与无感刷新（用于登录/刷新等接口） */
  skipAuth?: boolean;
}

/**
 * PureHttp 类类型定义
 */
export interface PureHttpClass {
  /**
   * 通用请求方法
   * @param method - HTTP 方法
   * @param url - 请求 URL
   * @param param - axios 配置
   * @param axiosConfig - 扩展配置
   */
  request<T>(
    method: RequestMethods,
    url: string,
    param?: AxiosRequestConfig,
    axiosConfig?: PureHttpRequestConfig
  ): Promise<T>;

  /**
   * POST 请求
   * @param url - 请求 URL
   * @param params - 请求参数配置
   * @param config - 扩展配置
   */
  post<T, P>(
    url: string,
    params?: AxiosRequestConfig<T>,
    config?: PureHttpRequestConfig
  ): Promise<P>;

  /**
   * GET 请求
   * @param url - 请求 URL
   * @param params - 请求参数配置
   * @param config - 扩展配置
   */
  get<T, P>(
    url: string,
    params?: AxiosRequestConfig<T>,
    config?: PureHttpRequestConfig
  ): Promise<P>;

  /**
   * PATCH 请求
   * @param url - 请求 URL
   * @param params - 请求参数配置
   * @param config - 扩展配置
   */
  patch<T, P>(
    url: string,
    params?: AxiosRequestConfig<T>,
    config?: PureHttpRequestConfig
  ): Promise<P>;

  /**
   * DELETE 请求
   * @param url - 请求 URL
   * @param params - 请求参数配置
   * @param config - 扩展配置
   */
  delete<T, P>(
    url: string,
    params?: AxiosRequestConfig<T>,
    config?: PureHttpRequestConfig
  ): Promise<P>;
}

// 保持向后兼容的默认导出
export default class PureHttp implements PureHttpClass {
  request<T>(
    method: RequestMethods,
    url: string,
    param?: AxiosRequestConfig,
    axiosConfig?: PureHttpRequestConfig
  ): Promise<T>;
  post<T, P>(
    url: string,
    params?: AxiosRequestConfig<T>,
    config?: PureHttpRequestConfig
  ): Promise<P>;
  get<T, P>(
    url: string,
    params?: AxiosRequestConfig<T>,
    config?: PureHttpRequestConfig
  ): Promise<P>;
  patch<T, P>(
    url: string,
    params?: AxiosRequestConfig<T>,
    config?: PureHttpRequestConfig
  ): Promise<P>;
  delete<T, P>(
    url: string,
    params?: AxiosRequestConfig<T>,
    config?: PureHttpRequestConfig
  ): Promise<P>;
}
