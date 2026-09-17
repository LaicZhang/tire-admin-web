import { describe, it, expect } from "vitest";
import {
  resolveApiError,
  getApiErrorCode,
  extractFieldErrors,
  resolveBoundedErrorCode,
  isApiErrorCode,
  isDomainErrorCode,
  isSystemErrorCode,
  isTransportErrorCode
} from "../apiErrorContract";

/** 后端失败信封（be-core AllExceptionsFilter，审计 §1）。 */
const failureEnvelope = (
  code: number,
  errorCode: string,
  extra: Record<string, unknown> = {}
) => ({
  code,
  errorCode,
  msg: "订单已锁定",
  data: null,
  meta: {
    timestamp: "2026-09-17T00:00:00.000Z",
    path: "/api/v1/x",
    errorCode
  },
  ...extra
});

describe("apiErrorContract: 码格式判定", () => {
  it("识别 DOMAIN.REASON / SYSTEM.* / HTTP_<status>", () => {
    expect(isDomainErrorCode("STATE.ORDER_LOCKED")).toBe(true);
    expect(isDomainErrorCode("SYSTEM.DB_UNIQUE_VIOLATION")).toBe(true);
    expect(isDomainErrorCode("order_locked")).toBe(false);
    expect(isSystemErrorCode("SYSTEM.DB_UNIQUE_VIOLATION")).toBe(true);
    expect(isSystemErrorCode("SYSTEM.")).toBe(false);
    expect(isTransportErrorCode("HTTP_404")).toBe(true);
    expect(isTransportErrorCode("HTTP_40")).toBe(false);
    expect(isApiErrorCode("SYSTEM.UNHANDLED")).toBe(true);
    expect(isApiErrorCode("HTTP_500")).toBe(false);
  });
});

describe("apiErrorContract: resolveApiError", () => {
  it("成功响应不带 errorCode（§2.8 明确未变项）", () => {
    const resolved = resolveApiError(
      { code: 200, data: { list: [] }, msg: "success" },
      { status: 200 }
    );
    expect(resolved.kind).toBe("success");
    expect(resolved.code).toBe(200);
    expect(resolved.errorCode).toBeUndefined();
  });

  it("业务码：顶层 errorCode 优先，code 仅是 HTTP 状态码", () => {
    const resolved = resolveApiError(
      failureEnvelope(409, "STATE.ORDER_LOCKED"),
      {
        status: 409
      }
    );
    expect(resolved).toEqual({
      kind: "dynamic",
      code: 409,
      errorCode: "STATE.ORDER_LOCKED",
      errorCodeSource: "errorCode",
      msg: "订单已锁定",
      fieldErrors: [],
      meta: {
        timestamp: "2026-09-17T00:00:00.000Z",
        path: "/api/v1/x",
        errorCode: "STATE.ORDER_LOCKED"
      }
    });
  });

  it("系统码：SYSTEM.DB_* 走 system 分类", () => {
    const resolved = resolveApiError(
      failureEnvelope(409, "SYSTEM.DB_UNIQUE_VIOLATION"),
      { status: 409 }
    );
    expect(resolved.kind).toBe("system");
    expect(resolved.errorCode).toBe("SYSTEM.DB_UNIQUE_VIOLATION");
    expect(resolved.errorCodeSource).toBe("errorCode");
  });

  it("状态码型失败：整条信封无 errorCode 时按 HTTP_<code> 兜底", () => {
    const resolved = resolveApiError({
      code: 404,
      msg: "Cannot GET /x",
      data: null
    });
    expect(resolved).toMatchObject({
      kind: "static",
      code: 404,
      errorCode: "HTTP_404",
      errorCodeSource: "http-fallback"
    });
  });

  it("未匹配路由兜底信封（§2.5）：不再依赖 HTML 判定", () => {
    const resolved = resolveApiError(
      {
        code: 404,
        errorCode: "HTTP_404",
        msg: "Cannot GET /api/v1/x",
        data: null
      },
      { status: 404 }
    );
    expect(resolved.kind).toBe("static");
    expect(resolved.errorCode).toBe("HTTP_404");
  });

  it("传输层兜底码 HTTP_429 原样保留（§2 约定 4）", () => {
    const resolved = resolveApiError(
      { code: 429, errorCode: "HTTP_429", msg: "Too Many Requests" },
      { status: 429 }
    );
    expect(resolved.kind).toBe("static");
    expect(resolved.errorCode).toBe("HTTP_429");
  });

  it("业务码（非 HTTP 状态）：code 不落在 400-599 时按 errorCode 判定", () => {
    const resolved = resolveApiError(
      {
        code: 10001,
        errorCode: "RESOURCE.RECORD_NOT_FOUND",
        msg: "记录不存在"
      },
      { status: 400 }
    );
    expect(resolved).toMatchObject({
      kind: "dynamic",
      code: 10001,
      errorCode: "RESOURCE.RECORD_NOT_FOUND"
    });
  });

  it("顶层 errorCode 显式存在但不合法 → 降级 HTTP_<status>，不用 meta 覆盖（§2.3）", () => {
    const resolved = resolveApiError(
      {
        code: 10001,
        errorCode: "ORDER_LOCKED",
        msg: "订单已锁定",
        meta: { errorCode: "STATE.ORDER_LOCKED" }
      },
      { status: 403 }
    );
    expect(resolved.kind).toBe("transport");
    expect(resolved.errorCode).toBe("HTTP_403");
    expect(resolved.errorCodeSource).toBe("http-fallback");
  });

  it("顶层 errorCode 缺失时回退 meta.errorCode（过渡期双写）", () => {
    const resolved = resolveApiError(
      {
        code: 10001,
        msg: "订单已锁定",
        data: null,
        meta: { errorCode: "STATE.ORDER_LOCKED" }
      },
      { status: 409 }
    );
    expect(resolved.kind).toBe("dynamic");
    expect(resolved.errorCode).toBe("STATE.ORDER_LOCKED");
    expect(resolved.errorCodeSource).toBe("meta.errorCode");
  });

  it("旧业务码落在 400-599 且无 errorCode 时按状态码降级（§2.7 双轨残留）", () => {
    const resolved = resolveApiError(
      {
        code: 422,
        msg: "导出任务已提交",
        data: { code: "ASYNC_EXPORT_REQUIRED" }
      },
      { status: 422 }
    );
    expect(resolved.kind).toBe("static");
    expect(resolved.errorCode).toBe("HTTP_422");
    // data.code 旧业务码不再参与码位解析
    expect(resolved.fieldErrors).toEqual([]);
  });

  it("顶层与 meta 都不是合法码时按传输层兜底", () => {
    const resolved = resolveApiError(
      {
        code: 1000,
        errorCode: "not_a_code",
        msg: "x",
        meta: { errorCode: "not_a_code" }
      },
      { status: 400 }
    );
    expect(resolved.kind).toBe("transport");
    expect(resolved.errorCode).toBe("HTTP_400");
    expect(resolved.code).toBe(1000);
  });

  it("code 落在 HTTP 状态区间时以状态码为准，不读 errorCode（§1 约定 1）", () => {
    const resolved = resolveApiError(
      { code: 409, errorCode: "P2002", msg: "unique" },
      { status: 409 }
    );
    expect(resolved.kind).toBe("static");
    expect(resolved.errorCode).toBe("HTTP_409");
  });

  it("DTO 校验失败读取 data.errors（§2.4）", () => {
    const resolved = resolveApiError(
      {
        code: 400,
        errorCode: "VALIDATION.REQUEST_INVALID",
        msg: "Invalid params: 数量必须为正数, nested.code 不能为空",
        data: {
          errors: [
            {
              field: "quantity",
              constraint: "isPositive",
              message: "数量必须为正数"
            },
            {
              field: "nested.code",
              constraint: "isNotEmpty",
              message: "不能为空"
            }
          ]
        },
        meta: { errorCode: "VALIDATION.REQUEST_INVALID" }
      },
      { status: 400 }
    );
    expect(resolved.fieldErrors).toEqual([
      {
        field: "quantity",
        constraint: "isPositive",
        message: "数量必须为正数"
      },
      { field: "nested.code", constraint: "isNotEmpty", message: "不能为空" }
    ]);
  });

  it("data.errors 元素缺字段时被跳过，而非整条丢弃或抛错", () => {
    const resolved = resolveApiError({
      code: 400,
      errorCode: "VALIDATION.REQUEST_INVALID",
      data: {
        errors: [
          { field: "ok", constraint: "isString", message: "m" },
          { field: "missing-constraint", message: "m" },
          "not-an-object",
          null
        ]
      }
    });
    expect(resolved.fieldErrors).toEqual([
      { field: "ok", constraint: "isString", message: "m" }
    ]);
  });

  it("非法输入不抛错，统一落 HTTP_<status>", () => {
    for (const payload of [null, undefined, 0, "", [], "boom"]) {
      const resolved = resolveApiError(payload, { status: 500 });
      expect(resolved.kind).toBe("transport");
      expect(resolved.errorCode).toBe("HTTP_500");
      expect(resolved.fieldErrors).toEqual([]);
    }
    expect(resolveApiError(null).errorCode).toBe("HTTP_0");
  });

  it("缺 code 但有 msg 时保留文案", () => {
    const resolved = resolveApiError(
      { msg: "服务暂时不可用" },
      { status: 503 }
    );
    expect(resolved.msg).toBe("服务暂时不可用");
    expect(resolved.errorCode).toBe("HTTP_503");
  });

  it("message 字段作为 msg 的兜底来源", () => {
    const resolved = resolveApiError({ code: 400, message: "fallback msg" });
    expect(resolved.msg).toBe("fallback msg");
  });

  it("成功信封里的 data.errors（导入预览）不进入 fieldErrors", () => {
    const resolved = resolveApiError(
      {
        code: 200,
        msg: "success",
        data: { errors: [{ row: 1, message: "第1行：Invalid data" }] }
      },
      { status: 200 }
    );
    expect(resolved.kind).toBe("success");
    expect(resolved.fieldErrors).toEqual([]);
  });
});

describe("apiErrorContract: extractFieldErrors", () => {
  it("非对象 / 无 errors 数组返回空", () => {
    expect(extractFieldErrors(null)).toEqual([]);
    expect(extractFieldErrors([])).toEqual([]);
    expect(extractFieldErrors({ errors: "nope" })).toEqual([]);
    expect(extractFieldErrors({})).toEqual([]);
  });
});

describe("apiErrorContract: resolveBoundedErrorCode", () => {
  it("合法码透传，非法码降级", () => {
    expect(resolveBoundedErrorCode("STATE.ORDER_LOCKED", 409)).toBe(
      "STATE.ORDER_LOCKED"
    );
    expect(resolveBoundedErrorCode("SYSTEM.DB_FOREIGN_KEY", 400)).toBe(
      "SYSTEM.DB_FOREIGN_KEY"
    );
    expect(resolveBoundedErrorCode("HTTP_429", 429)).toBe("HTTP_429");
    expect(resolveBoundedErrorCode("P2002", 409)).toBe("HTTP_409");
    expect(resolveBoundedErrorCode(undefined, 404)).toBe("HTTP_404");
  });
});

describe("apiErrorContract: getApiErrorCode", () => {
  it("取到码位；拿不到时返回 HTTP_<status>", () => {
    expect(
      getApiErrorCode(failureEnvelope(409, "STATE.ORDER_LOCKED"), 409)
    ).toBe("STATE.ORDER_LOCKED");
    expect(getApiErrorCode({ code: 503, msg: "x" }, 503)).toBe("HTTP_503");
    expect(getApiErrorCode(null)).toBe("HTTP_0");
  });
});
