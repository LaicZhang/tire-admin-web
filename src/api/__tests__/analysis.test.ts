import { describe, expect, it, vi, beforeEach } from "vitest";
import {
  getAnalysisMembersApi,
  getInventoryMovementApi,
  getSerialProductSummaryApi,
  getSerialRelatedApi,
  getSerialTraceApi,
  getSalesSummaryApi,
  getProviderEvaluationApi,
  getPurchaseOrderTrackingApi,
  getPurchaseTrendApi,
  getSalesOrderTrackingApi,
  getIncomeExpenseSummaryApi,
  getCashFlowApi,
  getFundReportApi,
  getBalanceTrendApi,
  getProfitStatementApi,
  getGrossProfitApi,
  getNetProfitApi,
  getSalesRegionApi,
  getSalesProvinceApi,
  getSalesSummaryByDimensionApi,
  getPurchaseSummaryByDimensionApi,
  getProviderQualityIssuesApi,
  getReceivableAgingApi,
  getPayableAgingApi,
  getCustomerRankingApi,
  getSlowMovingApi,
  getStockoutApi,
  getDotAgingApi,
  exportReportApi,
  getReportSubscriptionsApi,
  getReportSubscriptionApi,
  createReportSubscriptionApi,
  updateReportSubscriptionApi,
  deleteReportSubscriptionApi
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

  it("requests serial trace by serialNo", async () => {
    await getSerialTraceApi("SN/001");

    expect(http.request).toHaveBeenCalledWith(
      "get",
      "/api/v1/analysis/inventory/serial-trace/SN%2F001"
    );
  });

  it("requests related serials by serialNo", async () => {
    await getSerialRelatedApi("SN/002");

    expect(http.request).toHaveBeenCalledWith(
      "get",
      "/api/v1/analysis/inventory/serial-related/SN%2F002"
    );
  });

  it("requests same-product summary by serialNo", async () => {
    await getSerialProductSummaryApi("SN/003");

    expect(http.request).toHaveBeenCalledWith(
      "get",
      "/api/v1/analysis/inventory/serial-product-summary/SN%2F003"
    );
  });

  it("aligns finance income-expense path to BE", async () => {
    const params = { startDate: "2026-07-01", endDate: "2026-07-31" };
    await getIncomeExpenseSummaryApi(params);
    expect(http.request).toHaveBeenCalledWith(
      "get",
      "/api/v1/analysis/income-expense-summary",
      { params }
    );
  });

  it("aligns cash-flow path to BE and drops groupBy", async () => {
    await getCashFlowApi({
      startDate: "2026-07-01",
      endDate: "2026-07-31",
      groupBy: "month"
    });
    expect(http.request).toHaveBeenCalledWith(
      "get",
      "/api/v1/analysis/cash-flow",
      { params: { startDate: "2026-07-01", endDate: "2026-07-31" } }
    );
  });

  it("uses fund/report for balance trend substitute", async () => {
    await getFundReportApi({
      startDate: "2026-07-01",
      endDate: "2026-07-31",
      reportType: "daily"
    });
    expect(http.request).toHaveBeenCalledWith(
      "get",
      "/api/v1/analysis/fund/report",
      {
        params: {
          startDate: "2026-07-01",
          endDate: "2026-07-31",
          reportType: "daily"
        }
      }
    );

    vi.mocked(http.request).mockClear();
    await getBalanceTrendApi({
      startDate: "2026-07-01",
      endDate: "2026-07-31",
      paymentUid: "pay-1"
    });
    expect(http.request).toHaveBeenCalledWith(
      "get",
      "/api/v1/analysis/fund/report",
      {
        params: {
          startDate: "2026-07-01",
          endDate: "2026-07-31",
          reportType: "daily",
          accountId: "pay-1"
        }
      }
    );
  });

  it("maps profit gross/net orphans to profit/statement", async () => {
    await getProfitStatementApi({
      startDate: "2026-07-01",
      endDate: "2026-07-31"
    });
    expect(http.request).toHaveBeenCalledWith(
      "get",
      "/api/v1/analysis/profit/statement",
      { params: { startDate: "2026-07-01", endDate: "2026-07-31" } }
    );

    vi.mocked(http.request).mockClear();
    await getGrossProfitApi({
      startDate: "2026-07-01",
      endDate: "2026-07-31",
      groupBy: "month"
    });
    expect(http.request).toHaveBeenCalledWith(
      "get",
      "/api/v1/analysis/profit/statement",
      { params: { startDate: "2026-07-01", endDate: "2026-07-31" } }
    );

    vi.mocked(http.request).mockClear();
    await getNetProfitApi({
      startDate: "2026-07-01",
      endDate: "2026-07-31",
      groupBy: "week"
    });
    expect(http.request).toHaveBeenCalledWith(
      "get",
      "/api/v1/analysis/profit/statement",
      { params: { startDate: "2026-07-01", endDate: "2026-07-31" } }
    );
  });

  it("requests sales region analysis", async () => {
    const params = {
      startDate: "2026-07-01",
      endDate: "2026-07-31",
      groupBy: "week" as const,
      regionId: 3
    };
    await getSalesRegionApi(params);
    expect(http.request).toHaveBeenCalledWith(
      "get",
      "/api/v1/analysis/sales/region",
      { params }
    );
  });

  it("requests sales province analysis", async () => {
    const params = { startDate: "2026-07-01", endDate: "2026-07-31" };
    await getSalesProvinceApi(params);
    expect(http.request).toHaveBeenCalledWith(
      "get",
      "/api/v1/analysis/sales/province",
      { params }
    );
  });

  it("requests sales and purchase dimension summaries", async () => {
    await getSalesSummaryByDimensionApi({
      startDate: "2026-07-01",
      endDate: "2026-07-31",
      groupBy: "customer",
      limit: 20
    });
    expect(http.request).toHaveBeenCalledWith(
      "get",
      "/api/v1/analysis/sales/summary/dimension",
      {
        params: {
          startDate: "2026-07-01",
          endDate: "2026-07-31",
          groupBy: "customer",
          limit: 20
        }
      }
    );

    vi.mocked(http.request).mockClear();
    await getPurchaseSummaryByDimensionApi({
      groupBy: "provider",
      limit: 10
    });
    expect(http.request).toHaveBeenCalledWith(
      "get",
      "/api/v1/analysis/purchase/summary/dimension",
      { params: { groupBy: "provider", limit: 10 } }
    );
  });

  it("requests provider quality issues", async () => {
    const params = {
      startDate: "2026-07-01",
      endDate: "2026-07-31",
      providerId: "p1"
    };
    await getProviderQualityIssuesApi(params);
    expect(http.request).toHaveBeenCalledWith(
      "get",
      "/api/v1/analysis/provider-quality-issues",
      { params }
    );
  });

  it("requests receivable/payable aging with agingDays buckets", async () => {
    const params = {
      startDate: "2026-07-01",
      endDate: "2026-07-31",
      agingDays: [30, 60, 90]
    };
    await getReceivableAgingApi(params);
    expect(http.request).toHaveBeenCalledWith(
      "get",
      "/api/v1/analysis/receivable/aging",
      { params }
    );

    vi.mocked(http.request).mockClear();
    await getPayableAgingApi({
      ...params,
      agingDays: [15, 30, 60, 90]
    });
    expect(http.request).toHaveBeenCalledWith(
      "get",
      "/api/v1/analysis/payable/aging",
      {
        params: {
          startDate: "2026-07-01",
          endDate: "2026-07-31",
          agingDays: [15, 30, 60, 90]
        }
      }
    );
  });

  it("requests ranking and inventory enhancement endpoints", async () => {
    await getCustomerRankingApi({
      startDate: "2026-07-01",
      endDate: "2026-07-31",
      limit: 20
    });
    expect(http.request).toHaveBeenCalledWith(
      "get",
      "/api/v1/analysis/ranking/customers",
      {
        params: {
          startDate: "2026-07-01",
          endDate: "2026-07-31",
          limit: 20
        }
      }
    );

    vi.mocked(http.request).mockClear();
    await getSlowMovingApi({ days: 90, repoId: "r1" });
    expect(http.request).toHaveBeenCalledWith(
      "get",
      "/api/v1/analysis/slow-moving",
      { params: { days: 90, repoId: "r1" } }
    );

    vi.mocked(http.request).mockClear();
    await getStockoutApi({ repoId: "r1" });
    expect(http.request).toHaveBeenCalledWith(
      "get",
      "/api/v1/analysis/stockout",
      { params: { repoId: "r1" } }
    );

    vi.mocked(http.request).mockClear();
    await getDotAgingApi({ repoId: "r1" });
    expect(http.request).toHaveBeenCalledWith(
      "get",
      "/api/v1/analysis/inventory/dot-aging",
      { params: { repoId: "r1" } }
    );
  });
});

it("requests analysis overview export as blob", async () => {
  const params = {
    startDate: "2026-07-01",
    endDate: "2026-07-31",
    format: "excel" as const
  };

  await exportReportApi(params);

  expect(http.request).toHaveBeenCalledWith("get", "/api/v1/analysis/export", {
    params,
    responseType: "blob"
  });
});

it("requests report subscriptions CRUD endpoints", async () => {
  await getReportSubscriptionsApi({
    reportType: "sales_summary",
    status: true
  });
  expect(http.request).toHaveBeenCalledWith(
    "get",
    "/api/v1/analysis/subscriptions",
    { params: { reportType: "sales_summary", status: true } }
  );

  await getReportSubscriptionApi("sub-1");
  expect(http.request).toHaveBeenCalledWith(
    "get",
    "/api/v1/analysis/subscriptions/sub-1"
  );

  const createPayload = {
    name: "每日销售",
    reportType: "sales_summary",
    frequency: "daily" as const,
    channels: ["email"],
    recipients: ["boss@example.com"]
  };
  await createReportSubscriptionApi(createPayload);
  expect(http.request).toHaveBeenCalledWith(
    "post",
    "/api/v1/analysis/subscriptions",
    { data: createPayload }
  );

  await updateReportSubscriptionApi("sub-1", { status: false });
  expect(http.request).toHaveBeenCalledWith(
    "patch",
    "/api/v1/analysis/subscriptions/sub-1",
    { data: { status: false } }
  );

  await deleteReportSubscriptionApi("sub-1");
  expect(http.request).toHaveBeenCalledWith(
    "delete",
    "/api/v1/analysis/subscriptions/sub-1"
  );
});
