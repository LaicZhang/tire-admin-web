import { http } from "../utils/http";
import { baseUrlApi } from "./utils";
import type { CommonResult } from "./type";

const dashboardPrefix = "/dashboard/";

// Dashboard Summary Response Type
export interface DashboardSummary {
  stockAlertCount: number;
  stockOverflowCount: number;
  expiryAlertCount: number;
  unshippedSalesCount: number;
  unstockedPurchaseCount: number;
}

// Ranking Item Type
export interface RankingItem {
  id: string;
  name: string;
  amount: string;
  count: number;
  rank: number;
}

// Daily Summary Item Type
export interface DailySummaryItem {
  date: string;
  purchaseAmount: string;
  salesAmount: string;
}

// Purchase Sales Response Type
export interface PurchaseSalesData {
  dailySummary: DailySummaryItem[];
  topSalesProducts: RankingItem[];
  topPurchaseProducts: RankingItem[];
  topProviders: RankingItem[];
  topCustomers: RankingItem[];
  totalPurchaseAmount: string;
  totalSalesAmount: string;
}

export interface DashboardOverviewFilters {
  startDate: string;
  endDate: string;
  storeId?: string;
  repoId?: string;
}

export interface DashboardTrendItem {
  label: string;
  amount?: string;
  count?: number;
  value?: number;
}

export interface DashboardRankingItem {
  id: string;
  name: string;
  rank: number;
  amount?: string;
  count?: number;
  value?: number;
}

export interface DashboardAlertItem {
  key: string;
  label: string;
  value: string;
  level: "info" | "warning" | "danger";
}

export interface StoreMetrics {
  summary: {
    salesAmount: string;
    paidAmount: string;
    totalOrders: number;
    averageOrderValue: string;
    completionRate: number;
  };
  trend: DashboardTrendItem[];
  ranking: DashboardRankingItem[];
  alerts: DashboardAlertItem[];
}

export interface WarehouseMetrics {
  summary: {
    totalValue: string;
    totalCount: number;
    skuCount: number;
    repoCount: number;
    toBeStockedCount: number;
    toBeShippedCount: number;
    inTransitCount: number;
    belowAlarmCount: number;
    expiringBatchCount: number;
  };
  trend: DashboardTrendItem[];
  ranking: DashboardRankingItem[];
  alerts: DashboardAlertItem[];
}

export interface PurchaseMetrics {
  summary: {
    totalAmount: string;
    paidAmount: string;
    unpaidAmount: string;
    totalOrders: number;
    averageOrderValue: string;
    arrivalRate: number;
  };
  trend: DashboardTrendItem[];
  ranking: DashboardRankingItem[];
  alerts: DashboardAlertItem[];
}

export interface SalesMetrics {
  summary: {
    totalAmount: string;
    paidAmount: string;
    unpaidAmount: string;
    totalOrders: number;
    averageOrderValue: string;
    completionRate: number;
  };
  trend: DashboardTrendItem[];
  ranking: DashboardRankingItem[];
  alerts: DashboardAlertItem[];
}

export interface DashboardOverviewData {
  filters: DashboardOverviewFilters;
  storeMetrics: StoreMetrics;
  warehouseMetrics: WarehouseMetrics;
  purchaseMetrics: PurchaseMetrics;
  salesMetrics: SalesMetrics;
}

/**
 * 获取仪表盘汇总数据
 * GET /api/v1/dashboard/summary
 */
export async function getDashboardSummaryApi() {
  return await http.request<CommonResult<DashboardSummary>>(
    "get",
    baseUrlApi(dashboardPrefix + "summary")
  );
}

/**
 * 获取采购销售总览
 * GET /api/v1/dashboard/purchase-sales
 * @param days 查询天数，默认7，范围1-90
 */
export async function getPurchaseSalesApi(days?: number) {
  return await http.request<CommonResult<PurchaseSalesData>>(
    "get",
    baseUrlApi(dashboardPrefix + "purchase-sales"),
    { params: { days } }
  );
}

export async function getDashboardOverviewApi(params?: {
  startDate?: string;
  endDate?: string;
  storeId?: string;
  repoId?: string;
}) {
  return await http.request<CommonResult<DashboardOverviewData>>(
    "get",
    baseUrlApi(dashboardPrefix + "overview"),
    { params }
  );
}
