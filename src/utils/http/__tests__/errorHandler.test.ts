import { describe, it, expect, vi } from "vitest";
import type { AxiosError } from "axios";
import {
  HttpErrorType,
  classifyHttpError,
  reportHttpError,
  setErrorReporter,
  defaultErrorReporter,
  getUserFriendlyMessage
} from "../errorHandler";
import type { ErrorReporter, HttpErrorInfo } from "../errorHandler";

describe("HTTP errorHandler", () => {
  describe("classifyHttpError", () => {
    it("should classify cancelled request", () => {
      const error = {
        name: "CanceledError",
        code: "ERR_CANCELED",
        config: { url: "/api/test", method: "get" }
      } as unknown as AxiosError;

      const result = classifyHttpError(error);
      expect(result.type).toBe(HttpErrorType.CANCELLED);
      expect(result.message).toBe("请求已取消");
    });

    it("should classify network error", () => {
      const error = {
        code: "ERR_NETWORK",
        config: { url: "/api/test", method: "get" },
        response: undefined
      } as unknown as AxiosError;

      const result = classifyHttpError(error);
      expect(result.type).toBe(HttpErrorType.NETWORK);
    });

    it("should classify timeout error by code", () => {
      const error = {
        code: "ECONNABORTED",
        message: "",
        config: { url: "/api/test", method: "get" },
        response: undefined
      } as unknown as AxiosError;

      const result = classifyHttpError(error);
      expect(result.type).toBe(HttpErrorType.TIMEOUT);
    });

    it("should classify timeout error by message", () => {
      const error = {
        message: "timeout of 10000ms exceeded",
        config: { url: "/api/test", method: "get" },
        response: { status: 0 }
      } as unknown as AxiosError;

      const result = classifyHttpError(error);
      expect(result.type).toBe(HttpErrorType.TIMEOUT);
    });

    it("should classify 401 as unauthorized", () => {
      const error = {
        config: { url: "/api/test", method: "get" },
        response: { status: 401 },
        message: ""
      } as unknown as AxiosError;

      const result = classifyHttpError(error);
      expect(result.type).toBe(HttpErrorType.UNAUTHORIZED);
      expect(result.statusCode).toBe(401);
    });

    it("should classify 403 as forbidden", () => {
      const error = {
        config: { url: "/api/test", method: "get" },
        response: { status: 403 },
        message: ""
      } as unknown as AxiosError;

      const result = classifyHttpError(error);
      expect(result.type).toBe(HttpErrorType.FORBIDDEN);
    });

    it("should classify 404 as not found", () => {
      const error = {
        config: { url: "/api/test", method: "get" },
        response: { status: 404 },
        message: ""
      } as unknown as AxiosError;

      const result = classifyHttpError(error);
      expect(result.type).toBe(HttpErrorType.NOT_FOUND);
    });

    it("should classify 5xx as server error", () => {
      const error = {
        config: { url: "/api/test", method: "get" },
        response: { status: 500 },
        message: ""
      } as unknown as AxiosError;

      const result = classifyHttpError(error);
      expect(result.type).toBe(HttpErrorType.SERVER_ERROR);
    });

    it("should classify 4xx as client error", () => {
      const error = {
        config: { url: "/api/test", method: "post" },
        response: { status: 422 },
        message: ""
      } as unknown as AxiosError;

      const result = classifyHttpError(error);
      expect(result.type).toBe(HttpErrorType.CLIENT_ERROR);
    });

    it("should include url and method in result", () => {
      const error = {
        config: { url: "/api/users", method: "post" },
        response: { status: 400 },
        message: ""
      } as unknown as AxiosError;

      const result = classifyHttpError(error);
      expect(result.url).toBe("/api/users");
      expect(result.method).toBe("POST");
    });
  });

  describe("reportHttpError", () => {
    it("should call custom reporter", () => {
      const mockReporter: ErrorReporter = {
        report: vi.fn()
      };
      setErrorReporter(mockReporter);

      const error = {
        config: { url: "/api/test", method: "get" },
        response: { status: 500 },
        message: ""
      } as unknown as AxiosError;

      const result = reportHttpError(error);

      expect(mockReporter.report).toHaveBeenCalledWith(result);
      expect(result.type).toBe(HttpErrorType.SERVER_ERROR);

      // Reset to default
      setErrorReporter(defaultErrorReporter);
    });
  });

  describe("getUserFriendlyMessage", () => {
    it("should return the message from error info", () => {
      const errorInfo: HttpErrorInfo = {
        type: HttpErrorType.NETWORK,
        message: "网络连接失败，请检查网络设置",
        timestamp: Date.now()
      };

      expect(getUserFriendlyMessage(errorInfo)).toBe(
        "网络连接失败，请检查网络设置"
      );
    });
  });
});
