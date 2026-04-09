import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import type { AxiosError, AxiosInstance } from "axios";
import { createRetryInterceptor } from "../retry";

const mockWarn = vi.fn();

vi.mock("@/utils/logger", () => ({
  httpLogger: { warn: (...args: unknown[]) => mockWarn(...args) }
}));

function makeAxiosError(input: {
  method?: string;
  url?: string;
  responseStatus?: number;
  code?: string;
  message?: string;
  config?: Record<string, unknown> | undefined;
}): AxiosError {
  const hasExplicitConfig = Object.prototype.hasOwnProperty.call(
    input,
    "config"
  );
  const config = hasExplicitConfig
    ? input.config
    : ({
        method: input.method,
        url: input.url
      } as Record<string, unknown>);

  return {
    config: config as never,
    response: input.responseStatus
      ? ({ status: input.responseStatus } as never)
      : undefined,
    code: input.code,
    message: input.message ?? ""
  } as unknown as AxiosError;
}

describe("createRetryInterceptor", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    mockWarn.mockReset();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("非幂等方法：不重试，直接拒绝", async () => {
    const instance = { request: vi.fn() } as unknown as AxiosInstance;
    const { responseErrorInterceptor } = createRetryInterceptor();
    const error = makeAxiosError({
      method: "post",
      url: "/api/v1/a",
      code: "ERR_NETWORK",
      message: "network error"
    });

    await expect(responseErrorInterceptor(error, instance)).rejects.toBe(error);
    expect(instance.request).not.toHaveBeenCalled();
  });

  it("命中 excludeErrorCodes：不重试，直接拒绝", async () => {
    const instance = { request: vi.fn() } as unknown as AxiosInstance;
    const { responseErrorInterceptor } = createRetryInterceptor({
      excludeErrorCodes: ["ERR_FATAL_CONFIG"]
    });
    const error = makeAxiosError({
      method: "get",
      url: "/api/v1/a",
      code: "ERR_FATAL_CONFIG",
      message: "fatal"
    });

    await expect(responseErrorInterceptor(error, instance)).rejects.toBe(error);
    expect(instance.request).not.toHaveBeenCalled();
  });

  it("GET 网络错误：按 maxRetries 重试并返回重试结果", async () => {
    const instance = {
      request: vi.fn(async (config: Record<string, unknown>) => ({
        ok: true,
        url: config.url,
        retry: config.__retryCount
      }))
    } as unknown as AxiosInstance;

    const { responseErrorInterceptor } = createRetryInterceptor({
      maxRetries: 1
    });
    const error = makeAxiosError({
      method: "get",
      url: "/api/v1/a",
      code: "ERR_NETWORK",
      message: "network error"
    });

    const promise = responseErrorInterceptor(error, instance);
    await vi.runAllTimersAsync();

    await expect(promise).resolves.toEqual({
      ok: true,
      url: "/api/v1/a",
      retry: 1
    });
    expect(instance.request).toHaveBeenCalledTimes(1);
  });

  it("maxRetries=0：不重试", async () => {
    const instance = { request: vi.fn() } as unknown as AxiosInstance;
    const { responseErrorInterceptor } = createRetryInterceptor({
      maxRetries: 0
    });
    const error = makeAxiosError({
      method: "get",
      url: "/api/v1/a",
      code: "ERR_NETWORK",
      message: "network error"
    });

    await expect(responseErrorInterceptor(error, instance)).rejects.toBe(error);
    expect(instance.request).not.toHaveBeenCalled();
  });

  it("存在服务端响应：不重试", async () => {
    const instance = { request: vi.fn() } as unknown as AxiosInstance;
    const { responseErrorInterceptor } = createRetryInterceptor();
    const error = makeAxiosError({
      method: "get",
      url: "/api/v1/a",
      responseStatus: 500,
      message: "Request failed with status code 500"
    });

    await expect(responseErrorInterceptor(error, instance)).rejects.toBe(error);
    expect(instance.request).not.toHaveBeenCalled();
  });

  it("缺少 error.config：不重试，直接拒绝", async () => {
    const instance = { request: vi.fn() } as unknown as AxiosInstance;
    const { responseErrorInterceptor } = createRetryInterceptor();
    const error = makeAxiosError({
      method: "get",
      url: "/api/v1/a",
      code: "ERR_NETWORK",
      message: "network error",
      config: undefined
    });

    await expect(responseErrorInterceptor(error, instance)).rejects.toBe(error);
  });
});
