import { beforeEach, describe, expect, it, vi } from "vitest";
import type { AxiosInstance } from "axios";
import { createCookieAuthInterceptor } from "../cookie-auth";

// 避免引入真实 `@/utils/auth`（其内部依赖 store/api/http，单测环境下会触发循环依赖）。
vi.mock("@/utils/auth", () => ({
  getToken: vi.fn(),
  formatToken: (token: string) => `Bearer ${token}`,
  getCsrfToken: vi.fn(),
  csrfHeaderName: "X-CSRF-TOKEN",
  csrfCookieName: "_csrf",
  useHttpOnlyCookie: false
}));

const mockLogOut = vi.fn();

type PendingQueue = {
  enqueue: (config: unknown) => Promise<unknown>;
  resolveAll: (mapper: (config: unknown) => unknown) => void;
  rejectAll: (error: unknown) => void;
};

function createDeferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (error: unknown) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

function createTestPendingQueue(): PendingQueue & { size: () => number } {
  const entries: Array<{
    config: unknown;
    deferred: ReturnType<typeof createDeferred<unknown>>;
  }> = [];

  return {
    enqueue: config => {
      const deferred = createDeferred<unknown>();
      entries.push({ config, deferred });
      return deferred.promise;
    },
    resolveAll: mapper => {
      for (const entry of entries.splice(0)) {
        entry.deferred.resolve(mapper(entry.config));
      }
    },
    rejectAll: error => {
      for (const entry of entries.splice(0)) {
        entry.deferred.reject(error);
      }
    },
    size: () => entries.length
  };
}

function makeError(input: {
  status?: number;
  url?: string;
  skipAuth?: boolean;
  __cookieAuthRetry?: boolean;
}) {
  const config = input.url
    ? ({
        url: input.url,
        skipAuth: input.skipAuth,
        __cookieAuthRetry: input.__cookieAuthRetry
      } as unknown)
    : undefined;

  return {
    config,
    response: input.status ? { status: input.status } : undefined
  } as unknown as { config?: unknown; response?: { status?: number } };
}

describe("createCookieAuthInterceptor", () => {
  beforeEach(() => {
    mockLogOut.mockReset();
  });

  it("非 401：直接拒绝原错误", async () => {
    const pendingQueue = createTestPendingQueue();
    const instance = { request: vi.fn() } as unknown as AxiosInstance;
    const { responseErrorInterceptor } = createCookieAuthInterceptor({
      pendingQueue
    });

    const error = makeError({ status: 500, url: "/api/v1/x" });
    await expect(
      responseErrorInterceptor(error as never, instance)
    ).rejects.toBe(error);
  });

  it("401 但缺少 error.config：直接拒绝原错误", async () => {
    const pendingQueue = createTestPendingQueue();
    const instance = { request: vi.fn() } as unknown as AxiosInstance;
    const { responseErrorInterceptor } = createCookieAuthInterceptor({
      pendingQueue
    });

    const error = makeError({ status: 401 });
    await expect(
      responseErrorInterceptor(error as never, instance)
    ).rejects.toBe(error);
  });

  it("401 且 skipAuth=true：直接拒绝原错误", async () => {
    const pendingQueue = createTestPendingQueue();
    const instance = { request: vi.fn() } as unknown as AxiosInstance;
    const { responseErrorInterceptor } = createCookieAuthInterceptor({
      pendingQueue
    });

    const error = makeError({
      status: 401,
      url: "/api/v1/a",
      skipAuth: true
    });
    await expect(
      responseErrorInterceptor(error as never, instance)
    ).rejects.toBe(error);
  });

  it("401 且白名单：直接拒绝原错误", async () => {
    const pendingQueue = createTestPendingQueue();
    const instance = { request: vi.fn() } as unknown as AxiosInstance;
    const { responseErrorInterceptor } = createCookieAuthInterceptor({
      pendingQueue
    });

    const error = makeError({
      status: 401,
      url: "/api/v1/auth/login"
    });
    await expect(
      responseErrorInterceptor(error as never, instance)
    ).rejects.toBe(error);
  });

  it("401 且已重试标记存在：直接拒绝原错误", async () => {
    const pendingQueue = createTestPendingQueue();
    const instance = { request: vi.fn() } as unknown as AxiosInstance;
    const { responseErrorInterceptor } = createCookieAuthInterceptor({
      pendingQueue
    });

    const error = makeError({
      status: 401,
      url: "/api/v1/a",
      __cookieAuthRetry: true
    });
    await expect(
      responseErrorInterceptor(error as never, instance)
    ).rejects.toBe(error);
  });

  it("401：refresh 成功后重放原请求", async () => {
    const pendingQueue = createTestPendingQueue();
    const instance = {
      request: vi.fn(async (config: { url?: string }) => {
        if (config.url === "/api/v1/auth/refresh-token")
          return { ok: "refresh" };
        return { ok: "retry", url: config.url };
      })
    } as unknown as AxiosInstance;

    const { responseErrorInterceptor } = createCookieAuthInterceptor({
      pendingQueue
    });

    const error = makeError({ status: 401, url: "/api/v1/a" });
    await expect(
      responseErrorInterceptor(error as never, instance)
    ).resolves.toEqual({ ok: "retry", url: "/api/v1/a" });

    expect(instance.request).toHaveBeenCalledWith({
      method: "post",
      url: "/api/v1/auth/refresh-token",
      skipAuth: true
    });
  });

  it("并发 401：刷新进行中时入队，刷新成功后批量重放", async () => {
    const pendingQueue = createTestPendingQueue();
    const refreshDeferred = createDeferred<{ ok: true }>();

    const instance = {
      request: vi.fn(async (config: { url?: string }) => {
        if (config.url === "/api/v1/auth/refresh-token") {
          return refreshDeferred.promise;
        }
        return { ok: true, url: config.url };
      })
    } as unknown as AxiosInstance;

    const { responseErrorInterceptor } = createCookieAuthInterceptor({
      pendingQueue
    });

    const e1 = makeError({ status: 401, url: "/api/v1/a" });
    const e2 = makeError({ status: 401, url: "/api/v1/b" });

    const p1 = responseErrorInterceptor(e1 as never, instance);
    expect(pendingQueue.size()).toBe(0);

    const p2 = responseErrorInterceptor(e2 as never, instance);
    expect(pendingQueue.size()).toBe(1);

    refreshDeferred.resolve({ ok: true });

    await expect(p1).resolves.toEqual({ ok: true, url: "/api/v1/a" });
    await expect(p2).resolves.toEqual({ ok: true, url: "/api/v1/b" });
    expect(
      vi
        .mocked(instance.request)
        .mock.calls.filter(([c]) => c.url === "/api/v1/auth/refresh-token")
    ).toHaveLength(1);
  });

  it("401：refresh 失败时 rejectAll 并登出", async () => {
    const pendingQueue = createTestPendingQueue();
    const refreshDeferred = createDeferred<unknown>();

    const instance = {
      request: vi.fn(async (config: { url?: string }) => {
        if (config.url === "/api/v1/auth/refresh-token") {
          return refreshDeferred.promise;
        }
        return { ok: true, url: config.url };
      })
    } as unknown as AxiosInstance;

    const { responseErrorInterceptor } = createCookieAuthInterceptor({
      pendingQueue,
      onLogout: mockLogOut
    });

    const e1 = makeError({ status: 401, url: "/api/v1/a" });
    const e2 = makeError({ status: 401, url: "/api/v1/b" });

    const p1 = responseErrorInterceptor(e1 as never, instance);
    const p2 = responseErrorInterceptor(e2 as never, instance);

    refreshDeferred.reject(new Error("refresh failed"));

    await expect(p1).rejects.toBeInstanceOf(Error);
    await expect(p2).rejects.toBeInstanceOf(Error);
    expect(mockLogOut).toHaveBeenCalledTimes(1);
  });
});
