import { beforeEach, describe, expect, it, vi } from "vitest";
import type { InternalAxiosRequestConfig } from "axios";

type TokenPayload = {
  accessToken?: string;
  refreshToken?: string;
  expires?: number | string;
};

const mockGetToken = vi.fn<() => TokenPayload | undefined>();
const mockFormatToken = vi.fn<(token: string) => string>();

const mockLogOut = vi.fn();
const mockHandRefreshToken =
  vi.fn<
    (input: {
      refreshToken: string;
    }) => Promise<{ data: { accessToken: string } }>
  >();

vi.mock("@/utils/auth", () => ({
  getToken: () => mockGetToken(),
  formatToken: (token: string) => mockFormatToken(token)
}));

vi.mock("@/store/modules/user", () => ({
  useUserStoreHook: () => ({
    logOut: mockLogOut,
    handRefreshToken: mockHandRefreshToken
  })
}));

async function load() {
  const mod = await import("../auth");
  return { createAuthInterceptor: mod.createAuthInterceptor };
}

type PendingQueue = {
  enqueue: (config: unknown) => Promise<unknown>;
  resolveAll: (mapper: (config: InternalAxiosRequestConfig) => unknown) => void;
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

function createTestPendingQueue(): PendingQueue {
  const entries: Array<{
    config: InternalAxiosRequestConfig;
    deferred: ReturnType<typeof createDeferred<unknown>>;
  }> = [];

  return {
    enqueue: config => {
      const deferred = createDeferred<unknown>();
      entries.push({
        config: config as unknown as InternalAxiosRequestConfig,
        deferred
      });
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
    }
  };
}

function makeConfig(
  input: Partial<InternalAxiosRequestConfig> & { skipAuth?: boolean } = {}
): InternalAxiosRequestConfig & { skipAuth?: boolean } {
  return {
    method: "get",
    url: "/api/v1/business/list",
    headers: {},
    ...input
  } as InternalAxiosRequestConfig & { skipAuth?: boolean };
}

describe("createAuthInterceptor", () => {
  beforeEach(() => {
    mockGetToken.mockReset();
    mockFormatToken.mockReset();
    mockLogOut.mockReset();
    mockHandRefreshToken.mockReset();
  });

  it("跳过鉴权：skipAuth=true 时不注入 Authorization", async () => {
    mockGetToken.mockReturnValue({
      accessToken: "token",
      expires: Date.now() + 60_000
    });
    mockFormatToken.mockImplementation(t => `Bearer ${t}`);

    const pendingQueue = createTestPendingQueue();
    const { createAuthInterceptor } = await load();
    const { requestInterceptor } = createAuthInterceptor({ pendingQueue });

    const config = makeConfig({ skipAuth: true });
    const result = await requestInterceptor(config);

    expect(result.headers).toEqual({});
    expect(mockFormatToken).not.toHaveBeenCalled();
  });

  it("白名单：登录/刷新接口不注入 Authorization", async () => {
    mockGetToken.mockReturnValue({
      accessToken: "token",
      expires: Date.now() + 60_000
    });
    mockFormatToken.mockImplementation(t => `Bearer ${t}`);

    const pendingQueue = createTestPendingQueue();
    const { createAuthInterceptor } = await load();
    const { requestInterceptor } = createAuthInterceptor({ pendingQueue });

    const login = await requestInterceptor(
      makeConfig({ url: "/api/v1/auth/login" })
    );
    const refresh = await requestInterceptor(
      makeConfig({ url: "/api/v1/auth/refresh-token" })
    );

    expect(login.headers).toEqual({});
    expect(refresh.headers).toEqual({});
  });

  it("正常：未过期 token 注入 Authorization", async () => {
    mockGetToken.mockReturnValue({
      accessToken: "access-1",
      expires: Date.now() + 60_000
    });
    mockFormatToken.mockImplementation(t => `Bearer ${t}`);

    const pendingQueue = createTestPendingQueue();
    const { createAuthInterceptor } = await load();
    const { requestInterceptor } = createAuthInterceptor({ pendingQueue });

    const result = await requestInterceptor(makeConfig());
    expect(result.headers).toMatchObject({ Authorization: "Bearer access-1" });
  });

  it("空/缺失：无 token 或无 accessToken 时不注入", async () => {
    mockFormatToken.mockImplementation(t => `Bearer ${t}`);

    const pendingQueue = createTestPendingQueue();
    const { createAuthInterceptor } = await load();
    const { requestInterceptor } = createAuthInterceptor({ pendingQueue });

    mockGetToken.mockReturnValue(undefined);
    const noToken = await requestInterceptor(makeConfig());
    expect(noToken.headers).not.toHaveProperty("Authorization");

    mockGetToken.mockReturnValue({ expires: Date.now() + 60_000 });
    const result = await requestInterceptor(makeConfig());
    expect(result.headers).not.toHaveProperty("Authorization");
    expect(mockFormatToken).not.toHaveBeenCalled();
  });

  it("非法 expires 且无 refreshToken：视为过期并登出", async () => {
    mockGetToken.mockReturnValue({
      accessToken: "broken",
      expires: "not-a-number"
    });

    const pendingQueue = createTestPendingQueue();
    const { createAuthInterceptor } = await load();
    const { requestInterceptor } = createAuthInterceptor({
      pendingQueue,
      onLogout: mockLogOut
    });

    await expect(requestInterceptor(makeConfig())).rejects.toBeInstanceOf(
      Error
    );
    expect(mockLogOut).toHaveBeenCalledTimes(1);
    expect(mockFormatToken).not.toHaveBeenCalled();
  });

  it("缺少 expires 且有 refreshToken：走刷新分支并注入新 token", async () => {
    mockGetToken.mockReturnValue({
      accessToken: "stale",
      refreshToken: "refresh-missing-expires"
    });
    mockFormatToken.mockImplementation(t => `Bearer ${t}`);
    mockHandRefreshToken.mockResolvedValue({
      data: { accessToken: "new-missing" }
    });

    const pendingQueue = createTestPendingQueue();
    const { createAuthInterceptor } = await load();
    const { requestInterceptor } = createAuthInterceptor({ pendingQueue });

    const result = await requestInterceptor(makeConfig());

    expect(mockHandRefreshToken).toHaveBeenCalledWith({
      refreshToken: "refresh-missing-expires"
    });
    expect(result.headers).toMatchObject({
      Authorization: "Bearer new-missing"
    });
  });

  it("过期且无 refreshToken：登出并拒绝请求", async () => {
    mockGetToken.mockReturnValue({
      accessToken: "expired",
      expires: Date.now() - 1
    });

    const pendingQueue = createTestPendingQueue();
    const { createAuthInterceptor } = await load();
    const { requestInterceptor } = createAuthInterceptor({
      pendingQueue,
      onLogout: mockLogOut
    });

    await expect(requestInterceptor(makeConfig())).rejects.toBeInstanceOf(
      Error
    );
    expect(mockLogOut).toHaveBeenCalledTimes(1);
  });

  it("过期且有 refreshToken：并发入队，刷新成功后批量放行并注入新 token", async () => {
    mockGetToken.mockReturnValue({
      accessToken: "expired",
      refreshToken: "refresh-1",
      expires: Date.now() - 1
    });
    mockFormatToken.mockImplementation(t => `Bearer ${t}`);
    mockHandRefreshToken.mockResolvedValue({ data: { accessToken: "new-1" } });

    const pendingQueue = createTestPendingQueue();
    const { createAuthInterceptor } = await load();
    const { requestInterceptor } = createAuthInterceptor({ pendingQueue });

    const p1 = requestInterceptor(makeConfig({ url: "/api/v1/a" }));
    const p2 = requestInterceptor(makeConfig({ url: "/api/v1/b" }));

    const r1 = await p1;
    const r2 = await p2;

    expect(mockHandRefreshToken).toHaveBeenCalledTimes(1);
    expect(r1.headers).toMatchObject({ Authorization: "Bearer new-1" });
    expect(r2.headers).toMatchObject({ Authorization: "Bearer new-1" });
  });

  it("过期且有 refreshToken：刷新失败时 rejectAll 并登出", async () => {
    mockGetToken.mockReturnValue({
      accessToken: "expired",
      refreshToken: "refresh-1",
      expires: Date.now() - 1
    });
    mockHandRefreshToken.mockRejectedValue(new Error("refresh failed"));

    const pendingQueue = createTestPendingQueue();
    const { createAuthInterceptor } = await load();
    const { requestInterceptor } = createAuthInterceptor({
      pendingQueue,
      onLogout: mockLogOut
    });

    const p1 = requestInterceptor(makeConfig({ url: "/api/v1/a" }));
    const p2 = requestInterceptor(makeConfig({ url: "/api/v1/b" }));

    await expect(p1).rejects.toBeInstanceOf(Error);
    await expect(p2).rejects.toBeInstanceOf(Error);
    expect(mockLogOut).toHaveBeenCalledTimes(1);
  });
});
