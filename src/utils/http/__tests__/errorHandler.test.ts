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
        config: { url: "/api/v1/test", method: "get" }
      } as unknown as AxiosError;

      const result = classifyHttpError(error);
      expect(result.type).toBe(HttpErrorType.CANCELLED);
      expect(result.message).toBe("请求已取消");
    });

    it("should classify network error", () => {
      const error = {
        code: "ERR_NETWORK",
        config: { url: "/api/v1/test", method: "get" },
        response: undefined
      } as unknown as AxiosError;

      const result = classifyHttpError(error);
      expect(result.type).toBe(HttpErrorType.NETWORK);
    });

    it("should classify timeout error by code", () => {
      const error = {
        code: "ECONNABORTED",
        message: "",
        config: { url: "/api/v1/test", method: "get" },
        response: undefined
      } as unknown as AxiosError;

      const result = classifyHttpError(error);
      expect(result.type).toBe(HttpErrorType.TIMEOUT);
    });

    it("should classify timeout error by message", () => {
      const error = {
        message: "timeout of 10000ms exceeded",
        config: { url: "/api/v1/test", method: "get" },
        response: { status: 0 }
      } as unknown as AxiosError;

      const result = classifyHttpError(error);
      expect(result.type).toBe(HttpErrorType.TIMEOUT);
    });

    it("should classify 401 as unauthorized", () => {
      const error = {
        config: { url: "/api/v1/test", method: "get" },
        response: { status: 401 },
        message: ""
      } as unknown as AxiosError;

      const result = classifyHttpError(error);
      expect(result.type).toBe(HttpErrorType.UNAUTHORIZED);
      expect(result.statusCode).toBe(401);
    });

    it("should classify 403 as forbidden", () => {
      const error = {
        config: { url: "/api/v1/test", method: "get" },
        response: { status: 403 },
        message: ""
      } as unknown as AxiosError;

      const result = classifyHttpError(error);
      expect(result.type).toBe(HttpErrorType.FORBIDDEN);
    });

    it("should classify 404 as not found", () => {
      const error = {
        config: { url: "/api/v1/test", method: "get" },
        response: { status: 404 },
        message: ""
      } as unknown as AxiosError;

      const result = classifyHttpError(error);
      expect(result.type).toBe(HttpErrorType.NOT_FOUND);
    });

    it("should classify 5xx as server error", () => {
      const error = {
        config: { url: "/api/v1/test", method: "get" },
        response: { status: 500 },
        message: ""
      } as unknown as AxiosError;

      const result = classifyHttpError(error);
      expect(result.type).toBe(HttpErrorType.SERVER_ERROR);
    });

    it("should classify 4xx as client error", () => {
      const error = {
        config: { url: "/api/v1/test", method: "post" },
        response: { status: 422 },
        message: ""
      } as unknown as AxiosError;

      const result = classifyHttpError(error);
      expect(result.type).toBe(HttpErrorType.CLIENT_ERROR);
    });

    it("should include url and method in result", () => {
      const error = {
        config: { url: "/api/v1/users", method: "post" },
        response: { status: 400 },
        message: ""
      } as unknown as AxiosError;

      const result = classifyHttpError(error);
      expect(result.url).toBe("/api/v1/users");
      expect(result.method).toBe("POST");
    });
  });

  describe("classifyHttpError: 统一 Error Contract（审计 §1）", () => {
    it("业务码：读顶层 errorCode，状态分类不变", () => {
      const error = {
        config: { url: "/api/v1/orders", method: "patch" },
        response: {
          status: 409,
          data: {
            code: 409,
            errorCode: "STATE.ORDER_LOCKED",
            msg: "订单已锁定",
            data: null,
            meta: { errorCode: "STATE.ORDER_LOCKED" }
          }
        },
        message: "Request failed with status code 409"
      } as unknown as AxiosError;

      const result = classifyHttpError(error);
      expect(result.type).toBe(HttpErrorType.CLIENT_ERROR);
      expect(result.errorCode).toBe("STATE.ORDER_LOCKED");
      expect(result.kind).toBe("dynamic");
      expect(result.errorCodeSource).toBe("errorCode");
    });

    it("系统码：SYSTEM.DB_* 归入 system", () => {
      const error = {
        config: { url: "/api/v1/tires", method: "post" },
        response: {
          status: 409,
          data: {
            code: 409,
            errorCode: "SYSTEM.DB_UNIQUE_VIOLATION",
            msg: "唯一约束冲突",
            data: null,
            meta: { errorCode: "SYSTEM.DB_UNIQUE_VIOLATION" }
          }
        },
        message: ""
      } as unknown as AxiosError;

      const result = classifyHttpError(error);
      expect(result.kind).toBe("system");
      expect(result.errorCode).toBe("SYSTEM.DB_UNIQUE_VIOLATION");
    });

    it("未匹配路由兜底信封（§2.5）：errorCode 为 HTTP_404", () => {
      const error = {
        config: { url: "/api/v1/nope", method: "get" },
        response: {
          status: 404,
          data: {
            code: 404,
            errorCode: "HTTP_404",
            msg: "Cannot GET /api/v1/nope",
            data: null
          }
        },
        message: "Request failed with status code 404"
      } as unknown as AxiosError;

      const result = classifyHttpError(error);
      expect(result.type).toBe(HttpErrorType.NOT_FOUND);
      expect(result.errorCode).toBe("HTTP_404");
      expect(result.kind).toBe("static");
    });

    it("DTO 校验失败：带出 fieldErrors（§2.4）", () => {
      const error = {
        config: { url: "/api/v1/salary", method: "post" },
        response: {
          status: 400,
          data: {
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
            meta: { errorCode: "VALIDATION.REQUEST_INVALID" }
          }
        },
        message: ""
      } as unknown as AxiosError;

      const result = classifyHttpError(error);
      expect(result.errorCode).toBe("VALIDATION.REQUEST_INVALID");
      expect(result.fieldErrors).toEqual([
        { field: "amount", constraint: "isPositive", message: "金额必须为正数" }
      ]);
    });

    it("无信封时保持既有分类，且不带契约字段", () => {
      const error = {
        config: { url: "/api/v1/test", method: "get" },
        response: { status: 500, data: "<html>oops</html>" },
        message: ""
      } as unknown as AxiosError;

      const result = classifyHttpError(error);
      expect(result.type).toBe(HttpErrorType.SERVER_ERROR);
      expect(result.errorCode).toBeUndefined();
      expect(result.fieldErrors).toBeUndefined();
    });
  });

  describe("reportHttpError", () => {
    it("should call custom reporter", () => {
      const mockReporter: ErrorReporter = {
        report: vi.fn()
      };
      setErrorReporter(mockReporter);

      const error = {
        config: { url: "/api/v1/test", method: "get" },
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
