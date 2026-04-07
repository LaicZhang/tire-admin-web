import { beforeEach, describe, expect, it, vi } from "vitest";

type RequestInterceptor = (config: Record<string, unknown>) => unknown;

let capturedRequestInterceptor: RequestInterceptor | undefined;

const mockAxiosInstance = {
  interceptors: {
    request: {
      use: vi.fn((handler: RequestInterceptor) => {
        capturedRequestInterceptor = handler;
        return 0;
      })
    },
    response: {
      use: vi.fn(() => 0)
    }
  },
  request: vi.fn()
};

vi.mock("axios", () => ({
  default: {
    create: vi.fn(() => mockAxiosInstance),
    isCancel: vi.fn(() => false)
  }
}));

vi.mock("element-plus", () => ({
  ElMessage: { error: vi.fn() },
  ElMessageBox: { alert: vi.fn(() => Promise.resolve()) }
}));

vi.mock("@/store/modules/user", () => ({
  useUserStoreHook: () => ({
    logOut: vi.fn()
  })
}));

vi.mock("@/utils/auth-config", () => ({
  useHttpOnlyCookie: false
}));

vi.mock("@/utils/logger", () => ({
  httpLogger: {
    error: vi.fn()
  }
}));

vi.mock("../baseurl", () => ({
  resolveBaseURLFromViteEnv: vi.fn(() => ({
    baseURL: "/api",
    fatalError: undefined
  }))
}));

vi.mock("../pending-queue", () => ({
  createPendingQueue: vi.fn(() => ({}))
}));

vi.mock("../interceptors", () => ({
  createCookieAuthInterceptor: vi.fn(() => ({
    responseErrorInterceptor: vi.fn()
  })),
  createRetryInterceptor: vi.fn(() => ({
    responseErrorInterceptor: vi.fn(error => Promise.reject(error))
  })),
  registerAuthInterceptor: vi.fn(),
  registerCsrfInterceptor: vi.fn()
}));

describe("PureHttp request interceptor", () => {
  beforeEach(async () => {
    vi.resetModules();
    capturedRequestInterceptor = undefined;
    await import("../index");
  });

  it("injects idempotency key for requests with beforeRequestCallback", async () => {
    const beforeRequestCallback = vi.fn();

    const config = {
      method: "post",
      url: "/sale-order",
      headers: {},
      beforeRequestCallback
    };

    const result = await capturedRequestInterceptor?.(config);

    expect(beforeRequestCallback).toHaveBeenCalledTimes(1);
    expect(result).toEqual(
      expect.objectContaining({
        headers: expect.objectContaining({
          "x-idempotency-key": expect.any(String)
        })
      })
    );
  });
});
