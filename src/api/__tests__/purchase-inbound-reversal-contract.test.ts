import { beforeEach, describe, expect, it, vi } from "vitest";
import { http } from "@/utils/http";
import {
  restorePurchaseInboundApi,
  reversePurchaseInboundApi
} from "../purchase";

vi.mock("@/utils/http", () => ({
  http: { request: vi.fn() }
}));

describe("purchase inbound reversal contract", () => {
  beforeEach(() => {
    vi.mocked(http.request).mockReset();
    vi.mocked(http.request).mockResolvedValue({ code: 200, data: {} });
  });

  it("uses dedicated reverse and restore routes", async () => {
    await reversePurchaseInboundApi("grn-1", "录入错误");
    expect(http.request).toHaveBeenCalledWith(
      "post",
      "/api/v1/purchase-inbound/grn-1/reverse",
      { data: { reason: "录入错误" } }
    );

    await restorePurchaseInboundApi("grn-1");
    expect(http.request).toHaveBeenCalledWith(
      "post",
      "/api/v1/purchase-inbound/grn-1/restore"
    );
  });
});
