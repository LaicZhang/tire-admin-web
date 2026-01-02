import { beforeEach, describe, expect, it, vi } from "vitest";

type Deferred<T> = {
  promise: Promise<T>;
  resolve: (value: T) => void;
  reject: (reason?: unknown) => void;
};

const createDeferred = <T>(): Deferred<T> => {
  let resolve!: (value: T) => void;
  let reject!: (reason?: unknown) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
};

type AxiosConfigLike = { url?: string };

let axiosRequestMock: ReturnType<typeof vi.fn>;
let responseRejectedHandler: ((error: unknown) => Promise<unknown>) | undefined;

vi.mock("axios", () => {
  axiosRequestMock = vi.fn();

  return {
    default: {
      create: () => ({
        interceptors: {
          request: { use: vi.fn() },
          response: {
            use: vi.fn((_fulfilled: unknown, rejected: unknown) => {
              responseRejectedHandler = rejected as (
                error: unknown
              ) => Promise<unknown>;
            })
          }
        },
        request: axiosRequestMock
      }),
      isCancel: () => false
    }
  };
});

vi.mock("@/utils/auth-config", () => ({
  useHttpOnlyCookie: true,
  csrfCookieName: "_csrf",
  csrfHeaderName: "x-csrf-token"
}));

vi.mock("@/utils/auth", () => ({
  getCsrfToken: () => undefined,
  csrfHeaderName: "x-csrf-token",
  getToken: () => null,
  formatToken: (token: string) => `Bearer ${token}`
}));

const logOutMock = vi.fn();
vi.mock("@/store/modules/user", () => ({
  useUserStoreHook: () => ({ logOut: logOutMock })
}));

vi.mock("element-plus", () => ({
  ElMessage: { error: vi.fn() }
}));

describe("http (HttpOnly Cookie 401 refresh)", () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    responseRejectedHandler = undefined;

    vi.resetModules();
    await import("../http");

    expect(responseRejectedHandler).toBeTypeOf("function");
  });

  it("refreshes once and retries queued 401 requests", async () => {
    const refreshDeferred = createDeferred<unknown>();

    axiosRequestMock.mockImplementation((config: AxiosConfigLike) => {
      if (config.url === "/api/auth/refresh-token")
        return refreshDeferred.promise;
      return Promise.resolve({ ok: true, url: config.url });
    });

    const errorA = {
      config: { url: "/api/a", method: "get", headers: {} },
      response: { status: 401, data: { msg: "unauthorized" } }
    };
    const errorB = {
      config: { url: "/api/b", method: "get", headers: {} },
      response: { status: 401, data: { msg: "unauthorized" } }
    };

    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const pA = responseRejectedHandler!(errorA);
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const pB = responseRejectedHandler!(errorB);

    // refresh in-flight (only once)
    expect(axiosRequestMock).toHaveBeenCalledTimes(1);
    expect(axiosRequestMock).toHaveBeenCalledWith(
      expect.objectContaining({ url: "/api/auth/refresh-token" })
    );

    refreshDeferred.resolve({ ok: true });
    await expect(pA).resolves.toEqual({ ok: true, url: "/api/a" });
    await expect(pB).resolves.toEqual({ ok: true, url: "/api/b" });

    const urls = axiosRequestMock.mock.calls.map(call => call[0]?.url);
    expect(urls).toEqual(["/api/auth/refresh-token", "/api/a", "/api/b"]);

    expect(logOutMock).not.toHaveBeenCalled();
  });
});
