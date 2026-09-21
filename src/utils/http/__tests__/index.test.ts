import { describe, it, expect, vi, beforeEach } from "vitest";
import type { AxiosError, AxiosInstance } from "axios";
import { ElMessage } from "element-plus";

type ResponseErrorHandler = (error: unknown) => Promise<unknown>;

/** 捕获注册到 axios 实例上的响应错误拦截器（用于直接驱动拦截器逻辑）。 */
const interceptorHandlers = vi.hoisted(() => ({}) as { response?: unknown });

vi.mock("axios", () => {
  const instance = {
    interceptors: {
      request: { use: vi.fn() },
      response: {
        use: vi.fn(
          (
            _onFulfilled: unknown,
            onRejected: ResponseErrorHandler | undefined
          ) => {
            if (onRejected) interceptorHandlers.response = onRejected;
          }
        )
      }
    },
    request: vi.fn()
  } as unknown as AxiosInstance;

  return {
    default: {
      create: () => instance,
      isCancel: () => false
    },
    Axios: { isCancel: () => false }
  };
});

// Mock dependencies before importing the module
vi.mock("element-plus", () => ({
  ElMessage: {
    error: vi.fn()
  },
  ElMessageBox: {
    alert: vi.fn(() => Promise.resolve())
  }
}));

vi.mock("@/store/modules/user", () => ({
  useUserStoreHook: () => ({
    logOut: vi.fn(),
    handRefreshToken: vi.fn()
  })
}));

vi.mock("@/utils/auth-config", () => ({
  useHttpOnlyCookie: false,
  csrfCookieName: "_csrf",
  csrfHeaderName: "X-CSRF-TOKEN"
}));

vi.mock("@/utils/auth", () => ({
  getToken: vi.fn(),
  formatToken: vi.fn((token: string) => `Bearer ${token}`),
  getCsrfToken: vi.fn(() => "csrf-token"),
  csrfHeaderName: "X-CSRF-TOKEN"
}));

// Import after mocks are set up
import {
  shouldRetry,
  getRetryDelay,
  normalizePaginatedApiEnvelope
} from "../index";

describe("HTTP utility functions", () => {
  describe("shouldRetry", () => {
    it("should return false for fatal config error code", () => {
      const error = {
        code: "ERR_FATAL_CONFIG",
        config: { method: "get" },
        response: undefined
      } as unknown as AxiosError;
      expect(shouldRetry(error)).toBe(false);
    });

    it("should return false for non-idempotent methods (POST)", () => {
      const error = {
        config: { method: "post" },
        response: undefined
      } as unknown as AxiosError;
      expect(shouldRetry(error)).toBe(false);
    });

    it("should return false for non-idempotent methods (PUT)", () => {
      const error = {
        config: { method: "put" },
        response: undefined
      } as unknown as AxiosError;
      expect(shouldRetry(error)).toBe(false);
    });

    it("should return false for non-idempotent methods (DELETE)", () => {
      const error = {
        config: { method: "delete" },
        response: undefined
      } as unknown as AxiosError;
      expect(shouldRetry(error)).toBe(false);
    });

    it("should return true for GET with network error (no response)", () => {
      const error = {
        config: { method: "get" },
        response: undefined
      } as unknown as AxiosError;
      expect(shouldRetry(error)).toBe(true);
    });

    it("should return true for GET with ERR_NETWORK", () => {
      const error = {
        config: { method: "get" },
        response: undefined,
        code: "ERR_NETWORK"
      } as unknown as AxiosError;
      expect(shouldRetry(error)).toBe(true);
    });

    it("should return true for GET with timeout (ECONNABORTED)", () => {
      const error = {
        config: { method: "get" },
        response: undefined,
        code: "ECONNABORTED"
      } as unknown as AxiosError;
      expect(shouldRetry(error)).toBe(true);
    });

    it("should return true for GET with timeout message", () => {
      const error = {
        config: { method: "get" },
        response: undefined,
        message: "timeout of 10000ms exceeded"
      } as unknown as AxiosError;
      expect(shouldRetry(error)).toBe(true);
    });

    it("should return false for GET with server response (500)", () => {
      const error = {
        config: { method: "get" },
        response: { status: 500 },
        message: "Request failed with status code 500"
      } as unknown as AxiosError;
      expect(shouldRetry(error)).toBe(false);
    });

    it("should return false for GET with 404 response", () => {
      const error = {
        config: { method: "get" },
        response: { status: 404 },
        message: "Request failed with status code 404"
      } as unknown as AxiosError;
      expect(shouldRetry(error)).toBe(false);
    });

    it("should return true for HEAD with network error", () => {
      const error = {
        config: { method: "head" },
        response: undefined
      } as unknown as AxiosError;
      expect(shouldRetry(error)).toBe(true);
    });

    it("should return true for OPTIONS with network error", () => {
      const error = {
        config: { method: "options" },
        response: undefined
      } as unknown as AxiosError;
      expect(shouldRetry(error)).toBe(true);
    });

    it("should handle undefined config gracefully", () => {
      const error = {
        config: undefined
      } as unknown as AxiosError;
      expect(shouldRetry(error)).toBe(false);
    });

    it("should handle uppercase method names", () => {
      const error = {
        config: { method: "GET" },
        response: undefined
      } as unknown as AxiosError;
      expect(shouldRetry(error)).toBe(true);
    });
  });

  describe("getRetryDelay", () => {
    it("should return 1000ms for first retry (count = 0)", () => {
      expect(getRetryDelay(0)).toBe(1000);
    });

    it("should return 2000ms for second retry (count = 1)", () => {
      expect(getRetryDelay(1)).toBe(2000);
    });

    it("should return 4000ms for third retry (count = 2)", () => {
      expect(getRetryDelay(2)).toBe(4000);
    });

    it("should return 8000ms for fourth retry (count = 3)", () => {
      expect(getRetryDelay(3)).toBe(8000);
    });

    it("should cap at 10000ms for higher retry counts", () => {
      expect(getRetryDelay(4)).toBe(10000);
      expect(getRetryDelay(5)).toBe(10000);
      expect(getRetryDelay(10)).toBe(10000);
    });
  });

  describe("normalizePaginatedApiEnvelope", () => {
    it("should return original when data is missing", () => {
      const response: { code: number; msg: string; data?: unknown } = {
        code: 200,
        msg: "ok"
      };
      expect(normalizePaginatedApiEnvelope(response)).toBe(response);
    });

    it("should return original when data.list is not an array", () => {
      const response = {
        code: 200,
        msg: "ok",
        data: { list: "not-array", count: 1 }
      };
      expect(normalizePaginatedApiEnvelope(response)).toBe(response);
    });

    it("should return original when count is not a number", () => {
      const response = {
        code: 200,
        msg: "ok",
        data: { list: [], count: "12" }
      };
      expect(normalizePaginatedApiEnvelope(response)).toBe(response);
    });

    it("should map paginated count to total when total is missing", () => {
      const response = {
        code: 200,
        msg: "ok",
        data: {
          list: [{ id: 1 }],
          count: 12
        }
      };

      expect(normalizePaginatedApiEnvelope(response)).toEqual({
        code: 200,
        msg: "ok",
        data: {
          list: [{ id: 1 }],
          count: 12,
          total: 12
        }
      });
    });

    it("should keep existing total unchanged", () => {
      const response = {
        code: 200,
        msg: "ok",
        data: {
          list: [{ id: 1 }],
          count: 12,
          total: 8
        }
      };

      expect(normalizePaginatedApiEnvelope(response)).toBe(response);
    });
  });

  describe("失败信封解析（统一 Error Contract，审计 §2.4 / §2.5）", () => {
    /**
     * 拦截器对失败信封走 reject（T3-ADM-001 / T3-X-001）。
     * 业务码从被拒绝的信封顶层 `errorCode` 读取。
     */
    const envelopeError = (data: unknown, status: number): AxiosError =>
      ({
        isAxiosError: true,
        message: `Request failed with status code ${status}`,
        config: { url: "/api/v1/salary", method: "post", headers: {} },
        response: { status, statusText: "", headers: {}, config: {}, data }
      }) as unknown as AxiosError;

    let responseErrorHandler: ResponseErrorHandler;

    beforeEach(() => {
      expect(interceptorHandlers.response).toBeTypeOf("function");
      responseErrorHandler =
        interceptorHandlers.response as ResponseErrorHandler;
      vi.mocked(ElMessage.error).mockClear();
    });

    it("4xx 信封被 reject，且 errorCode / data.errors 完整保留", async () => {
      const envelope = {
        code: 400,
        errorCode: "VALIDATION.REQUEST_INVALID",
        msg: "Invalid params: 金额必须为正数",
        data: {
          errors: [
            {
              field: "amount",
              constraint: "isPositive",
              message: "金额必须为正数"
            }
          ]
        },
        meta: {
          path: "/api/v1/salary"
        }
      };

      await expect(
        responseErrorHandler(envelopeError(envelope, 400))
      ).rejects.toEqual(envelope);
      expect(ElMessage.error).toHaveBeenCalledWith(
        "Invalid params: 金额必须为正数"
      );
    });

    it("未匹配路由兜底 404 信封同样 reject，不再走 axios 兜底文案", async () => {
      const envelope = {
        code: 404,
        errorCode: "HTTP_404",
        msg: "Cannot GET /api/v1/nope",
        data: null,
        meta: { path: "/api/v1/nope" }
      };

      await expect(
        responseErrorHandler(envelopeError(envelope, 404))
      ).rejects.toEqual(envelope);
      expect(ElMessage.error).toHaveBeenCalledWith("Cannot GET /api/v1/nope");
    });

    it("非信封响应（HTML 404）仍 reject 原 error", async () => {
      const error = envelopeError("<html>Not Found</html>", 404);
      await expect(responseErrorHandler(error)).rejects.toBe(error);
      expect(ElMessage.error).toHaveBeenCalled();
    });
  });
});
