/**
 * HTTP 拦截器模块统一导出
 */

// Auth interceptor (Bearer token)
export {
  createAuthInterceptor,
  registerAuthInterceptor,
  authWhiteList,
  type AuthInterceptorOptions,
  type AuthInterceptorState
} from "./auth";

// CSRF interceptor
export { createCsrfInterceptor, registerCsrfInterceptor } from "./csrf";

// Retry interceptor
export {
  createRetryInterceptor,
  registerRetryInterceptor,
  shouldRetry,
  getRetryDelay,
  type RetryInterceptorOptions
} from "./retry";

// Cookie auth interceptor (HttpOnly mode)
export {
  createCookieAuthInterceptor,
  registerCookieAuthInterceptor,
  type CookieAuthInterceptorOptions,
  type CookieAuthInterceptorState
} from "./cookie-auth";
