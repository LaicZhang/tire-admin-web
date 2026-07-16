import { beforeEach, describe, expect, it, vi } from "vitest";
import { http } from "@/utils/http";
import { reverseSupplierClaimOrderApi } from "../business/order";

vi.mock("@/utils/http", () => ({
  http: { request: vi.fn() }
}));

describe("supplier claim reversal contract", () => {
  beforeEach(() => {
    vi.mocked(http.request).mockReset();
    vi.mocked(http.request).mockResolvedValue({ code: 200, data: {} });
  });

  it("uses the dedicated finance reversal route", async () => {
    await reverseSupplierClaimOrderApi("claim-1", "结算录入错误");

    expect(http.request).toHaveBeenCalledWith(
      "post",
      "/api/v1/supplier-claim-order/claim-1/reverse",
      { data: { reason: "结算录入错误" } }
    );
  });
});
