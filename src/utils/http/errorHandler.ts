/**
 * HTTP 错误处理增强工具
 * 提供统一的错误分类、日志上报和用户提示
 */
import type { AxiosError } from "axios";
import { httpLogger } from "@/utils/logger";

/**
 * 错误类型枚举
 */
export enum HttpErrorType {
  /** 网络错误 - 无法连接服务器 */
  NETWORK = "NETWORK",
  /** 超时错误 - 请求超时 */
  TIMEOUT = "TIMEOUT",
  /** 认证错误 - 401 未授权 */
  UNAUTHORIZED = "UNAUTHORIZED",
  /** 权限错误 - 403 禁止访问 */
  FORBIDDEN = "FORBIDDEN",
  /** 资源不存在 - 404 */
  NOT_FOUND = "NOT_FOUND",
  /** 服务器错误 - 5xx */
  SERVER_ERROR = "SERVER_ERROR",
  /** 客户端错误 - 4xx */
  CLIENT_ERROR = "CLIENT_ERROR",
  /** 请求取消 */
  CANCELLED = "CANCELLED",
  /** 未知错误 */
  UNKNOWN = "UNKNOWN"
}

/**
 * 统一的 HTTP 错误信息
 */
export interface HttpErrorInfo {
  type: HttpErrorType;
  message: string;
  statusCode?: number;
  url?: string;
  method?: string;
  timestamp: number;
  /** 原始错误 */
  originalError?: unknown;
}

/**
 * 对 Axios 错误进行分类
 */
export function classifyHttpError(error: AxiosError): HttpErrorInfo {
  const timestamp = Date.now();
  const url = error.config?.url;
  const method = error.config?.method?.toUpperCase();

  // 请求取消
  if (error.name === "CanceledError" || error.code === "ERR_CANCELED") {
    return {
      type: HttpErrorType.CANCELLED,
      message: "请求已取消",
      url,
      method,
      timestamp,
      originalError: error
    };
  }

  // 超时错误（需在网络错误之前检测，因为超时也没有 response）
  if (error.code === "ECONNABORTED" || error.message?.includes("timeout")) {
    return {
      type: HttpErrorType.TIMEOUT,
      message: "请求超时，请稍后重试",
      url,
      method,
      timestamp,
      originalError: error
    };
  }

  // 网络错误
  if (error.code === "ERR_NETWORK" || !error.response) {
    return {
      type: HttpErrorType.NETWORK,
      message: "网络连接失败，请检查网络设置",
      url,
      method,
      timestamp,
      originalError: error
    };
  }

  const status = error.response.status;

  // 根据状态码分类
  if (status === 401) {
    return {
      type: HttpErrorType.UNAUTHORIZED,
      message: "登录已过期，请重新登录",
      statusCode: status,
      url,
      method,
      timestamp,
      originalError: error
    };
  }

  if (status === 403) {
    return {
      type: HttpErrorType.FORBIDDEN,
      message: "没有权限访问此资源",
      statusCode: status,
      url,
      method,
      timestamp,
      originalError: error
    };
  }

  if (status === 404) {
    return {
      type: HttpErrorType.NOT_FOUND,
      message: "请求的资源不存在",
      statusCode: status,
      url,
      method,
      timestamp,
      originalError: error
    };
  }

  if (status >= 500) {
    return {
      type: HttpErrorType.SERVER_ERROR,
      message: "服务器错误，请稍后重试",
      statusCode: status,
      url,
      method,
      timestamp,
      originalError: error
    };
  }

  if (status >= 400) {
    return {
      type: HttpErrorType.CLIENT_ERROR,
      message: "请求参数错误",
      statusCode: status,
      url,
      method,
      timestamp,
      originalError: error
    };
  }

  return {
    type: HttpErrorType.UNKNOWN,
    message: error.message || "未知错误",
    statusCode: status,
    url,
    method,
    timestamp,
    originalError: error
  };
}

/**
 * 错误日志上报器接口
 */
export interface ErrorReporter {
  report(errorInfo: HttpErrorInfo): void;
}

/**
 * 默认错误日志上报器（仅开发环境打印）
 */
export const defaultErrorReporter: ErrorReporter = {
  report(errorInfo: HttpErrorInfo) {
    // 仅在开发环境输出详细日志
    if (import.meta.env.DEV) {
      const details = [
        `Type: ${errorInfo.type}`,
        `Message: ${errorInfo.message}`,
        `URL: ${errorInfo.method} ${errorInfo.url}`,
        errorInfo.statusCode ? `Status: ${errorInfo.statusCode}` : null,
        `Timestamp: ${new Date(errorInfo.timestamp).toISOString()}`
      ]
        .filter(Boolean)
        .join(", ");
      httpLogger.error(details);
    }
  }
};

/** 当前错误上报器 */
let currentReporter: ErrorReporter = defaultErrorReporter;

/**
 * 设置自定义错误上报器
 * 可用于将错误上报至 Sentry 等监控平台
 */
export function setErrorReporter(reporter: ErrorReporter): void {
  currentReporter = reporter;
}

/**
 * 上报 HTTP 错误
 */
export function reportHttpError(error: AxiosError): HttpErrorInfo {
  const errorInfo = classifyHttpError(error);
  currentReporter.report(errorInfo);
  return errorInfo;
}

/**
 * 获取用户友好的错误消息
 */
export function getUserFriendlyMessage(errorInfo: HttpErrorInfo): string {
  return errorInfo.message;
}
