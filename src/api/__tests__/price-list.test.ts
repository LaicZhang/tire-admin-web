import { beforeEach, describe, expect, it, vi } from "vitest";
import { http } from "@/utils/http";
import {
  createPriceListApi,
  deletePriceListApi,
  getPriceListListApi,
  quoteSalePriceApi,
  updatePriceListApi
} from "../business/price-list";

vi.mock("@/utils/http", () => ({
  http: {
    request: vi.fn()
  }
}));

describe("price list api contract", () => {
  beforeEach(() => {
    vi.mocked(http.request).mockReset();
    vi.mocked(http.request).mockResolvedValue({ code: 200, data: {} });
  });

  it("uses the backend price-list CRUD routes", async () => {
    const payload = { name: "门店标准价", type: "STANDARD" as const };

    await getPriceListListApi(2, { name: "门店" });
    await createPriceListApi(payload);
    await updatePriceListApi(7, { isActive: false });
    await deletePriceListApi(7);

    expect(http.request).toHaveBeenNthCalledWith(
      1,
      "get",
      "/api/v1/price-list",
      { params: { index: 2, name: "门店" } }
    );
    expect(http.request).toHaveBeenNthCalledWith(
      2,
      "post",
      "/api/v1/price-list",
      { data: payload }
    );
    expect(http.request).toHaveBeenNthCalledWith(
      3,
      "patch",
      "/api/v1/price-list/7",
      { data: { isActive: false } }
    );
    expect(http.request).toHaveBeenNthCalledWith(
      4,
      "delete",
      "/api/v1/price-list/7"
    );
  });

  it("requests a server-authoritative batch quote", async () => {
    const payload = {
      customerId: "customer-1",
      lines: [{ tireId: "tire-1", count: 3 }]
    };

    await quoteSalePriceApi(payload);

    expect(http.request).toHaveBeenCalledWith("post", "/api/v1/price/quote", {
      data: payload
    });
  });
});
