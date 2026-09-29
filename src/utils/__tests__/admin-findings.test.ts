import { describe, expect, it } from "vitest";
import { assertApiSuccess, ApiResponseError } from "../apiResponse";
import {
  resetPagination,
  changePaginationPage,
  changePaginationPageSize
} from "../pagination";
import { getCompanyScopedOptionKey } from "../companyOptionCache";

describe("admin audit regression primitives", () => {
  it("resets filters without changing the page-size contract", () => {
    const pagination = { currentPage: 4, pageSize: 50 };

    resetPagination(pagination);

    expect(pagination).toEqual({ currentPage: 1, pageSize: 50 });
  });

  it("keeps page changes separate from filter resets", () => {
    const pagination = { currentPage: 1, pageSize: 10 };

    changePaginationPage(pagination, 3);
    expect(pagination.currentPage).toBe(3);

    changePaginationPageSize(pagination, 50);
    expect(pagination).toEqual({ currentPage: 1, pageSize: 50 });
  });

  it("rejects non-success API envelopes with the unified error contract", () => {
    expect(() =>
      assertApiSuccess({
        code: 400,
        msg: "字段校验失败",
        errorCode: "VALIDATION.REQUEST_INVALID",
        data: {
          errors: [
            { field: "amount", constraint: "isPositive", message: "金额无效" }
          ]
        }
      })
    ).toThrow(ApiResponseError);

    try {
      assertApiSuccess({ code: 400, msg: "字段校验失败" });
    } catch (error) {
      expect(error).toBeInstanceOf(ApiResponseError);
      expect((error as ApiResponseError).resolved.errorCode).toBe("HTTP_400");
    }
  });

  it("isolates option cache keys by company", () => {
    expect(getCompanyScopedOptionKey("all_customers", "company-a")).toBe(
      "all_customers:company:company-a"
    );
    expect(getCompanyScopedOptionKey("all_customers", "company-a")).not.toBe(
      getCompanyScopedOptionKey("all_customers", "company-b")
    );
  });
});
