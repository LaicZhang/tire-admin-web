import { describe, it, expect, vi } from "vitest";
import type { AxiosError } from "axios";

// Mock dependencies before importing the module
vi.mock("element-plus", () => ({
  ElMessage: {
    error: vi.fn()
  }
}));

vi.mock("@/store/modules/user", () => ({
  useUserStoreHook: () => ({
    logOut: vi.fn(),
    handRefreshToken: vi.fn()
  })
}));

vi.mock("@/utils/auth", () => ({
  getToken: vi.fn(),
  formatToken: vi.fn((token: string) => `Bearer ${token}`),
  getCsrfToken: vi.fn(() => "csrf-token"),
  csrfHeaderName: "X-CSRF-TOKEN",
  useHttpOnlyCookie: false
}));

// Import after mocks are set up
import { shouldRetry, getRetryDelay } from "../index";

describe("HTTP utility functions", () => {
  describe("shouldRetry", () => {
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
});
