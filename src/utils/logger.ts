/**
 * 统一日志处理工具
 * 用于替代分散的 console.log/error/warn 调用
 * 生产环境自动禁用日志输出，避免敏感信息泄露
 */

const isDev = import.meta.env.DEV;

type LogLevel = "debug" | "info" | "warn" | "error";

interface LoggerOptions {
  /** 模块名称，用于日志前缀 */
  module?: string;
  /** 是否在生产环境也输出（仅用于关键错误） */
  forceProduction?: boolean;
}

function formatMessage(
  level: LogLevel,
  module: string,
  message: string
): string {
  const timestamp = new Date().toISOString();
  return `[${timestamp}] [${level.toUpperCase()}] [${module}] ${message}`;
}

/**
 * 安全地序列化对象，过滤敏感字段
 */
function safeStringify(obj: unknown): string {
  const sensitiveKeys = [
    "password",
    "token",
    "secret",
    "authorization",
    "cookie"
  ];

  try {
    return JSON.stringify(
      obj,
      (key, value) => {
        if (sensitiveKeys.some(k => key.toLowerCase().includes(k))) {
          return "[REDACTED]";
        }
        return value;
      },
      2
    );
  } catch {
    return String(obj);
  }
}

/**
 * 创建模块日志器
 * @param moduleName 模块名称
 * @returns 日志器对象
 */
export function createLogger(moduleName: string) {
  const log = (
    level: LogLevel,
    message: string,
    data?: unknown,
    options?: LoggerOptions
  ) => {
    const { forceProduction = false } = options || {};

    // 生产环境只输出 forceProduction 标记的错误
    if (!isDev && !forceProduction) return;

    const formattedMessage = formatMessage(level, moduleName, message);

    switch (level) {
      case "debug":
        if (isDev) console.warn(formattedMessage, data ?? "");
        break;
      case "info":
        if (isDev) console.warn(formattedMessage, data ?? "");
        break;
      case "warn":
        console.warn(formattedMessage, data ?? "");
        break;
      case "error":
        console.error(formattedMessage, data ? safeStringify(data) : "");
        break;
    }
  };

  return {
    debug: (message: string, data?: unknown) => log("debug", message, data),
    info: (message: string, data?: unknown) => log("info", message, data),
    warn: (message: string, data?: unknown) => log("warn", message, data),
    error: (message: string, data?: unknown, options?: LoggerOptions) =>
      log("error", message, data, options),
    /** 强制在生产环境也输出的错误日志 */
    critical: (message: string, data?: unknown) =>
      log("error", message, data, { forceProduction: true })
  };
}

/**
 * 默认全局日志器
 */
export const logger = createLogger("App");

/**
 * HTTP 请求日志器
 */
export const httpLogger = createLogger("HTTP");

/**
 * 认证相关日志器
 */
export const authLogger = createLogger("Auth");

/**
 * 路由相关日志器
 */
export const routerLogger = createLogger("Router");
