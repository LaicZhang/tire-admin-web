/**
 * T3-X-002：后端没有对应路由时显式拒绝，避免打到虚构 URL（404 被当成成功或静默错误）。
 */
export function unsupportedBackendRoute(missingRoute: string): Promise<never> {
  return Promise.reject(new Error(`后端未提供路由：${missingRoute}`));
}

type PagePayload = {
  list?: unknown;
  count?: number;
  total?: number;
};

/** 列表接口返回 `{ count, list }`，页面读的是 `data.total`。 */
export function withListTotal<T extends { data?: unknown }>(result: T): T {
  const data = result.data;
  if (!data || typeof data !== "object" || Array.isArray(data)) return result;
  const page = data as PagePayload;
  if (page.total == null && typeof page.count === "number") {
    return {
      ...result,
      data: {
        ...page,
        total: page.count
      }
    };
  }
  return result;
}
