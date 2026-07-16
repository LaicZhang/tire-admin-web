import { beforeEach, describe, expect, it, vi } from "vitest";
import { http } from "@/utils/http";
import { cancelTransferOrderApi } from "../business/order";

vi.mock("@/utils/http", () => ({ http: { request: vi.fn() } }));

describe("transfer safe cancellation contract", () => {
  beforeEach(() => {
    vi.mocked(http.request).mockReset();
    vi.mocked(http.request).mockResolvedValue({ code: 200, data: {} });
  });

  it("uses the dedicated pre-shipment cancellation route", async () => {
    await cancelTransferOrderApi("transfer-1", "计划取消");
    expect(http.request).toHaveBeenCalledWith(
      "post",
      "/api/v1/transfer-order/transfer-1/cancel",
      { data: { reason: "计划取消" } }
    );
  });
});
