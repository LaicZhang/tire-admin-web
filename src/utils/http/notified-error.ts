/** 拦截器已提示过的失败，用于抑制紧随其后的重复 toast 与未处理拒绝。 */
export const HTTP_ERROR_NOTIFIED = Symbol.for("tire.httpErrorNotified");

let followupErrorToastSuppressions = 0;
let unhandledGuardInstalled = false;

export function markHttpErrorNotified<T extends object>(value: T): T {
  Object.defineProperty(value, HTTP_ERROR_NOTIFIED, {
    value: true,
    enumerable: false,
    configurable: true
  });
  return value;
}

export function wasHttpErrorNotified(value: unknown): boolean {
  if (typeof value !== "object" || value === null) return false;
  const record = value as Record<symbol, unknown>;
  return record[HTTP_ERROR_NOTIFIED] === true;
}

/**
 * 抑制同一轮失败之后、下一次宏任务之前的 error toast。
 * 拦截器自己走 `ElMessage.error`，不经过这里。
 */
export function suppressFollowupErrorToasts(): void {
  followupErrorToastSuppressions += 1;
  queueMicrotask(() => {
    setTimeout(() => {
      followupErrorToastSuppressions = Math.max(
        0,
        followupErrorToastSuppressions - 1
      );
    }, 0);
  });
}

export function isFollowupErrorToastSuppressed(): boolean {
  return followupErrorToastSuppressions > 0;
}

export function installUnhandledHttpErrorGuard(): void {
  if (unhandledGuardInstalled || typeof window === "undefined") return;
  unhandledGuardInstalled = true;
  window.addEventListener("unhandledrejection", event => {
    if (wasHttpErrorNotified(event.reason)) {
      event.preventDefault();
    }
  });
}
