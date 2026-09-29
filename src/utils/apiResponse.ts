import { resolveApiError, type ResolvedApiError } from "./apiErrorContract";

export class ApiResponseError extends Error {
  readonly response: unknown;
  readonly resolved: ResolvedApiError;

  constructor(response: unknown, resolved: ResolvedApiError) {
    super(resolved.msg || "请求失败，请稍后重试");
    this.name = "ApiResponseError";
    this.response = response;
    this.resolved = resolved;
  }
}

export function assertApiSuccess<T extends { code?: number }>(response: T): T {
  const resolved = resolveApiError(response);
  if (resolved.kind !== "success") {
    throw new ApiResponseError(response, resolved);
  }
  return response;
}
