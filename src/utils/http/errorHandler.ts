/**
 * HTTP 错误处理增强工具
 * 提供统一的错误分类、日志上报和用户提示
 *
 * 错误码口径见 `@/utils/apiErrorContract`：`code` 是 HTTP 状态码，业务分支一律读
 * 顶层 `errorCode`（审计 §1 / §5.4）。
 */
import type { AxiosError } from "axios";
import { httpLogger } from "@/utils/logger";
import { isApiEnvelope, resolveApiError } from "@/utils/apiErrorContract";
import type {
  ApiEnvelope,
  ApiErrorKind,
  ApiFieldError
} from "@/utils/apiErrorContract";

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
  /** 契约码位（`DOMAIN.REASON` / `SYSTEM.*` / `HTTP_<status>`）；仅在后端返回信封时存在。 */
  errorCode?: string;
  /** 契约分类：状态码型 / 业务码型 / 系统码型 / 传输层兜底。 */
  kind?: ApiErrorKind;
  /** 码位来源：顶层 `errorCode`，或传输层兜底 `HTTP_<status>`。 */
  errorCodeSource?: "errorCode" | "http-fallback";
  /** DTO 校验失败的字段级明细（`data.errors`，审计 §2.4）。 */
  fieldErrors?: ApiFieldError[];
  /** 原始错误 */
  originalError?: unknown;
}

/** 信封判定复用契约模块：`code: number` + `msg: string`（审计 §2.5）。 */
function readErrorEnvelope(error: AxiosError): ApiEnvelope | undefined {
  const data = error.response?.data as unknown;
  return isApiEnvelope(data) ? data : undefined;
}

/** 状态码 → 错误类型的既有映射（保持与迁移前一致的分类顺序）。 */
function classifyStatus(status: number): HttpErrorType {
  if (status === 401) return HttpErrorType.UNAUTHORIZED;
  if (status === 403) return HttpErrorType.FORBIDDEN;
  if (status === 404) return HttpErrorType.NOT_FOUND;
  if (status >= 500) return HttpErrorType.SERVER_ERROR;
  if (status >= 400) return HttpErrorType.CLIENT_ERROR;
  return HttpErrorType.UNKNOWN;
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
  const envelope = readErrorEnvelope(error);
  const contract = envelope ? resolveApiError(envelope, { status }) : undefined;
  const type = classifyStatus(status);

  // 分类仍以 HTTP 状态为准：状态码归一化（审计 §2.1）只改变状态与码值，
  // 这里不引入新的分类分支，保证既有调用方语义不变。
  return {
    type,
    message: defaultMessageForType(type, error),
    statusCode: status,
    url,
    method,
    timestamp,
    ...(contract?.errorCode !== undefined
      ? { errorCode: contract.errorCode }
      : {}),
    ...(contract ? { kind: contract.kind } : {}),
    ...(contract ? { errorCodeSource: contract.errorCodeSource } : {}),
    ...(contract && contract.fieldErrors.length > 0
      ? { fieldErrors: contract.fieldErrors }
      : {}),
    originalError: error
  };
}

function defaultMessageForType(type: HttpErrorType, error: AxiosError): string {
  switch (type) {
    case HttpErrorType.UNAUTHORIZED:
      return "登录已过期，请重新登录";
    case HttpErrorType.FORBIDDEN:
      return "没有权限访问此资源";
    case HttpErrorType.NOT_FOUND:
      return "请求的资源不存在";
    case HttpErrorType.SERVER_ERROR:
      return "服务器错误，请稍后重试";
    case HttpErrorType.CLIENT_ERROR:
      return "请求参数错误";
    default:
      return error.message || "未知错误";
  }
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
