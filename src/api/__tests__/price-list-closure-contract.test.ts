import { beforeEach, describe, expect, it, vi } from "vitest";
import { http } from "@/utils/http";
import {
  getPriceListApi,
  updatePriceListDetailApi,
  unassignPriceListCustomerApi
} from "../business/price-list";

vi.mock("@/utils/http", () => ({ http: { request: vi.fn() } }));

describe("price-list closure API contract", () => {
  beforeEach(() => {
    vi.mocked(http.request).mockReset();
    vi.mocked(http.request).mockResolvedValue({ code: 200, data: {} });
  });

  it("uses detail, detail-update and customer-unassign endpoints", async () => {
    await getPriceListApi(3);
    await updatePriceListDetailApi(7, { price: 8800, minQuantity: 5 });
    await unassignPriceListCustomerApi(3, "customer-1");

    expect(http.request).toHaveBeenNthCalledWith(
      1,
      "get",
      "/api/v1/price-list/3"
    );
    expect(http.request).toHaveBeenNthCalledWith(
      2,
      "patch",
      "/api/v1/price-list/detail/7",
      { data: { price: 8800, minQuantity: 5 } }
    );
    expect(http.request).toHaveBeenNthCalledWith(
      3,
      "delete",
      "/api/v1/price-list/3/assign-customer/customer-1"
    );
  });
});
