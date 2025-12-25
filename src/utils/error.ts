import { message } from "./message";

export interface ApiError {
  message: string;
  code?: number;
  details?: unknown;
}

/**
 * 从未知错误中提取错误消息
 * @param error - 任意类型的错误
 * @param fallback - 默认错误消息
 * @returns 提取的错误消息字符串
 */
export function extractErrorMessage(
  error: unknown,
  fallback = "操作失败"
): string {
  if (error instanceof Error) return error.message;
  if (typeof error === "string") return error;
  if (error && typeof error === "object" && "message" in error) {
    return String((error as ApiError).message);
  }
  return fallback;
}

/**
 * 统一处理 API 错误并显示消息
 * @param error - 任意类型的错误
 * @param fallback - 默认错误消息
 */
export function handleApiError(error: unknown, fallback = "操作失败"): void {
  const msg = extractErrorMessage(error, fallback);
  message(msg, { type: "error" });
}

/**
 * 包装异步函数，自动处理错误
 * @param fn - 要执行的异步函数
 * @param fallbackMessage - 默认错误消息
 * @returns 函数执行结果或 undefined（如果出错）
 */
export async function withErrorHandling<T>(
  fn: () => Promise<T>,
  fallbackMessage?: string
): Promise<T | undefined> {
  try {
    return await fn();
  } catch (error) {
    handleApiError(error, fallbackMessage);
    return undefined;
  }
}

/**
 * 创建带有错误处理的异步函数包装器
 * 适用于需要反复使用的场景
 * @param fallbackMessage - 默认错误消息
 * @returns 包装函数
 */
export function createErrorHandler(fallbackMessage?: string) {
  return async <T>(fn: () => Promise<T>): Promise<T | undefined> => {
    return withErrorHandling(fn, fallbackMessage);
  };
}
