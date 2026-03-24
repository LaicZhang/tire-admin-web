import { describe, expect, it, vi, beforeEach } from "vitest";
import {
  getAnalysisMembersApi,
  getInventoryMovementApi,
  getSalesSummaryApi,
  getProviderEvaluationApi,
  getPurchaseOrderTrackingApi,
  getPurchaseTrendApi,
  getSalesOrderTrackingApi
} from "../analysis";
import { http } from "@/utils/http";

vi.mock("@/utils/http", () => ({
  http: {
    request: vi.fn()
  }
}));

describe("analysis api", () => {
  beforeEach(() => {
    vi.mocked(http.request).mockReset();
    vi.mocked(http.request).mockResolvedValue({ code: 200, data: {} });
  });

  it("requests purchase trend with grouped params", async () => {
    const params = {
      startDate: "2026-03-01",
      endDate: "2026-03-24",
      storeId: "store-1",
      groupBy: "week" as const
    };

    await getPurchaseTrendApi(params);

    expect(http.request).toHaveBeenCalledWith(
      "get",
      "/api/v1/analysis/purchase/trend",
      { params }
    );
  });

  it("requests purchase order tracking with paging filters", async () => {
    const params = {
      index: 2,
      pageSize: 20,
      status: "pending" as const,
      providerId: "provider-1"
    };

    await getPurchaseOrderTrackingApi(params);

    expect(http.request).toHaveBeenCalledWith(
      "get",
      "/api/v1/analysis/purchase/order-tracking",
      { params }
    );
  });

  it("requests provider evaluation report", async () => {
    const params = {
      startDate: "2026-03-01",
      endDate: "2026-03-24",
      providerId: "provider-1"
    };

    await getProviderEvaluationApi(params);

    expect(http.request).toHaveBeenCalledWith(
      "get",
      "/api/v1/analysis/purchase/provider-evaluation",
      { params }
    );
  });

  it("requests sales order tracking with paging filters", async () => {
    const params = {
      index: 3,
      pageSize: 50,
      status: "partial" as const,
      customerId: "customer-1"
    };

    await getSalesOrderTrackingApi(params);

    expect(http.request).toHaveBeenCalledWith(
      "get",
      "/api/v1/analysis/sales/order-tracking",
      { params }
    );
  });

  it("requests inventory movement summary", async () => {
    const params = {
      repoId: "repo-1",
      startDate: "2026-03-01",
      endDate: "2026-03-24"
    };

    await getInventoryMovementApi(params);

    expect(http.request).toHaveBeenCalledWith(
      "get",
      "/api/v1/analysis/inventory/movement",
      { params }
    );
  });

  it("requests sales summary with operator filter", async () => {
    const params = {
      startDate: "2026-03-01",
      endDate: "2026-03-24",
      storeId: "store-1",
      operatorId: "member-1"
    };

    await getSalesSummaryApi(params);

    expect(http.request).toHaveBeenCalledWith(
      "get",
      "/api/v1/analysis/sales/summary",
      { params }
    );
  });

  it("requests analysis members by module", async () => {
    await getAnalysisMembersApi({ module: "purchase" });

    expect(http.request).toHaveBeenCalledWith(
      "get",
      "/api/v1/analysis/members",
      { params: { module: "purchase" } }
    );
  });
});
