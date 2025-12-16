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

/**
 * 获取仪表盘汇总数据
 * GET /api/dashboard/summary
 */
export async function getDashboardSummaryApi() {
  return await http.request<CommonResult>(
    "get",
    baseUrlApi(dashboardPrefix + "summary")
  );
}

/**
 * 获取采购销售总览
 * GET /api/dashboard/purchase-sales
 * @param days 查询天数，默认7，范围1-90
 */
export async function getPurchaseSalesApi(days?: number) {
  return await http.request<CommonResult>(
    "get",
    baseUrlApi(dashboardPrefix + "purchase-sales"),
    { params: { days } }
  );
}
