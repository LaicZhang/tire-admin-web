import { http } from "../utils/http";
import { baseUrlApi } from "./utils";
import type { CommonResult } from "./type";

const prefix = "/analysis/";

// ============ Response Types ============

export interface InventorySummary {
  totalCount: number;
  toBeStockedCount: number;
  toBeShippedCount: number;
  inTransitCount: number;
  totalValue: string;
  skuCount: number;
  repoCount: number;
  belowAlarmCount: number;
}

export interface TurnoverData {
  turnoverRate: number;
  averageDays: number;
  details: Array<{
    repoName: string;
    turnoverRate: number;
  }>;
}

export interface AgingData {
  totalAmount: string;
  buckets: Array<{
    label: string;
    amount: string;
    count: number;
  }>;
  details: Array<{
    name: string;
    orderNumber?: string;
    orderDate?: string;
    dueAmount: string;
    agingDays: number;
    agingBucket?: string;
  }>;
}

export interface FinanceSummary {
  totalIncome: string;
  totalExpense: string;
  netCashFlow: string;
  currentBalance: string;
  trend: Array<{
    date: string;
    data: number;
  }>;
}

export interface SalesSummary {
  totalAmount: string;
  totalOrders: number;
  paidAmount: string;
  unpaidAmount: string;
  averageOrderValue: string;
  completionRate: number;
}

export interface PurchaseSummary {
  totalAmount: string;
  totalOrders: number;
  paidAmount: string;
  unpaidAmount: string;
  averageOrderValue: string;
  arrivalRate: number;
}

export interface TrendData {
  data?: Array<{ period: string; amount: string; count: number }>;
  trend?: unknown[];
}

export interface RankingData {
  items: Array<{
    rank?: number;
    name: string;
    amount: string;
    count?: number;
    quantity?: number;
  }>;
}

export interface ReturnRateData {
  rate: number;
  totalOrders: number;
  returnOrders: number;
  trend: Array<{ date: string; rate: number }>;
}

export interface ProfitData {
  totalGrossProfit?: string;
  totalRevenue?: string;
  totalCost?: string;
  totalNetProfit?: string;
  totalExpense?: string;
  trend: Array<{ period: string; value: number }>;
}

export interface ClaimLossData {
  totalLoss: number;
  claimCount: number;
  avgLoss: number;
  byReason: Array<{ reason: string; amount: number; count: number }>;
}

export interface SlowMovingData {
  list?: Array<{
    tireId: string;
    tireName: string;
    lastSaleDate: string;
    stockQuantity: number;
  }>;
  items?: Array<{
    tireId: string;
    tireName: string;
    lastSaleDate: string;
    stockQuantity: number;
  }>;
}

export interface ExpiryDistributionData {
  list?: Array<{ range: string; count: number; percentage: number }>;
  buckets?: unknown[];
}

export interface StockoutData {
  list?: Array<{ name: string; currentStock: number; minStock: number }>;
  items?: unknown[];
}

// 销售汇总
export async function getSalesSummaryApi(params?: {
  startDate?: string;
  endDate?: string;
}) {
  return await http.request<CommonResult<SalesSummary>>(
    "get",
    baseUrlApi(prefix + "sales/summary"),
    { params }
  );
}

// 销售趋势
export async function getSalesTrendApi(params?: {
  startDate?: string;
  endDate?: string;
  groupBy?: "day" | "week" | "month";
}) {
  return await http.request<CommonResult<TrendData>>(
    "get",
    baseUrlApi(prefix + "sales/trend"),
    { params }
  );
}

// 采购汇总
export async function getPurchaseSummaryApi(params?: {
  startDate?: string;
  endDate?: string;
}) {
  return await http.request<CommonResult<PurchaseSummary>>(
    "get",
    baseUrlApi(prefix + "purchase/summary"),
    { params }
  );
}

// 库存汇总
export async function getInventorySummaryApi() {
  return await http.request<CommonResult<InventorySummary>>(
    "get",
    baseUrlApi(prefix + "inventory/summary")
  );
}

// 应收账龄分析
export async function getReceivableAgingApi(params?: {
  startDate?: string;
  endDate?: string;
  agingDays?: number[];
}) {
  return await http.request<CommonResult<AgingData>>(
    "get",
    baseUrlApi(prefix + "receivable/aging"),
    { params }
  );
}

// 应付账龄分析
export async function getPayableAgingApi(params?: {
  startDate?: string;
  endDate?: string;
  agingDays?: number[];
}) {
  return await http.request<CommonResult<AgingData>>(
    "get",
    baseUrlApi(prefix + "payable/aging"),
    { params }
  );
}

// 客户排行榜
export async function getCustomerRankingApi(params?: {
  startDate?: string;
  endDate?: string;
  limit?: number;
}) {
  return await http.request<CommonResult<RankingData>>(
    "get",
    baseUrlApi(prefix + "ranking/customers"),
    { params }
  );
}

// 供应商排行榜
export async function getProviderRankingApi(params?: {
  startDate?: string;
  endDate?: string;
  limit?: number;
}) {
  return await http.request<CommonResult<RankingData>>(
    "get",
    baseUrlApi(prefix + "ranking/providers"),
    { params }
  );
}

// 商品排行榜
export async function getProductRankingApi(params?: {
  startDate?: string;
  endDate?: string;
  limit?: number;
  orderBy?: "quantity" | "amount" | "profit";
}) {
  return await http.request<CommonResult<RankingData>>(
    "get",
    baseUrlApi(prefix + "ranking/products"),
    { params }
  );
}

// 员工排行榜
export async function getOperatorRankingApi(params?: {
  startDate?: string;
  endDate?: string;
  limit?: number;
  orderBy?: "amount" | "count" | "collectionRate";
}) {
  return await http.request<CommonResult<RankingData>>(
    "get",
    baseUrlApi(prefix + "ranking/operators"),
    { params }
  );
}

// 采购明细
export interface PurchaseDetailOrderInfo {
  uid?: string;
  number?: string;
  providerId?: string;
  provider?: { uid?: string; name?: string };
  createAt?: string;
}

export interface PurchaseDetailItem {
  id: number;
  uid?: string;
  companyId?: string;
  repoId?: string;
  tireId?: string;
  unit?: string;
  unitPrice?: number | string;
  count?: number;
  totalAmount?: number | string;
  createAt?: string;
  order?: PurchaseDetailOrderInfo;
  tire?: { uid?: string; name?: string; barcode?: string };
  repo?: { uid?: string; name?: string };
}

export async function getPurchaseDetailApi(params?: {
  index?: number;
  startDate?: string;
  endDate?: string;
  providerId?: string;
  tireId?: string;
}) {
  return await http.request<
    CommonResult<{ count: number; list: PurchaseDetailItem[] }>
  >("get", baseUrlApi(prefix + "purchase/detail"), { params });
}

// 销售明细
export interface SaleDetailCustomerInfo {
  uid?: string;
  name?: string;
}

export interface SaleDetailOperatorInfo {
  uid?: string;
  name?: string;
  nickname?: string;
}

export interface SaleDetailOrderInfo {
  uid?: string;
  number?: string;
  docNo?: string;
  customerId?: string;
  operatorId?: string;
  total?: number | string;
  paidAmount?: number | string;
  logisticsStatus?: unknown;
  orderStatus?: unknown;
  createAt?: string;
  customer?: SaleDetailCustomerInfo;
  operator?: SaleDetailOperatorInfo;
}

export interface SaleDetailTireInfo {
  uid?: string;
  name?: string;
  barcode?: string;
  group?: string;
  format?: string;
  pattern?: string;
  loadIndex?: string;
  speedLevel?: string;
  tireBrandId?: string;
  purchasePrice?: number | string;
  salePrice?: number | string;
  unit?: string;
}

export interface SaleDetailRepoInfo {
  uid?: string;
  name?: string;
}

export interface SaleDetailItem {
  id: number;
  uid?: string;
  companyId?: string;
  repoId?: string;
  isGift?: boolean;
  orderId?: string;
  tireId?: string;
  unit?: string;
  unitPrice?: number | string;
  count?: number;
  discountType?: unknown;
  discountNumber?: number | string;
  discountPercentage?: number | string;
  discountedUnitPrice?: number | string;
  totalAmount?: number | string;
  desc?: string;
  currencyId?: string;
  taxIncluded?: boolean;
  taxRate?: number | string;
  taxAmount?: number | string;
  shippedCount?: number;
  deliveredCount?: number;
  createAt?: string;
  arrivalAt?: string;
  order?: SaleDetailOrderInfo;
  tire?: SaleDetailTireInfo;
  repo?: SaleDetailRepoInfo;
}

export async function getSaleDetailApi(params?: {
  index?: number;
  startDate?: string;
  endDate?: string;
  customerId?: string;
  operatorId?: string;
}) {
  return await http.request<
    CommonResult<{ count: number; list: SaleDetailItem[] }>
  >("get", baseUrlApi(prefix + "sale/detail"), { params });
}

// 退货率分析
export async function getReturnRateApi(params?: {
  startDate?: string;
  endDate?: string;
  dimension?: "tire" | "provider";
}) {
  return await http.request<CommonResult<ReturnRateData>>(
    "get",
    baseUrlApi(prefix + "return-rate"),
    { params }
  );
}

// 理赔损失分析
export async function getClaimLossApi(params?: {
  startDate?: string;
  endDate?: string;
}) {
  return await http.request<CommonResult<ClaimLossData>>(
    "get",
    baseUrlApi(prefix + "claim-loss"),
    { params }
  );
}

// 滞销商品分析
export async function getSlowMovingApi(params?: { days?: number }) {
  return await http.request<CommonResult<SlowMovingData>>(
    "get",
    baseUrlApi(prefix + "slow-moving"),
    { params }
  );
}

// 库存周转率
export async function getInventoryTurnoverApi(params?: { repoId?: string }) {
  return await http.request<CommonResult<TurnoverData>>(
    "get",
    baseUrlApi(prefix + "inventory-turnover"),
    { params }
  );
}

// 临期分布
export async function getExpiryDistributionApi(params?: {
  repoId?: string;
  days?: string;
}) {
  return await http.request<CommonResult<ExpiryDistributionData>>(
    "get",
    baseUrlApi(prefix + "expiry-distribution"),
    { params }
  );
}

// 缺货分析
export async function getStockoutApi() {
  return await http.request<CommonResult<StockoutData>>(
    "get",
    baseUrlApi(prefix + "stockout")
  );
}

// 报表导出
export async function exportReportApi(params?: {
  startDate?: string;
  endDate?: string;
  format?: "excel";
}) {
  return await http.request<Blob>("get", baseUrlApi(prefix + "export"), {
    params,
    responseType: "blob"
  });
}

// 利润核算 - 毛利分析
export async function getGrossProfitApi(params?: {
  startDate?: string;
  endDate?: string;
  groupBy?: "day" | "week" | "month";
}) {
  return await http.request<CommonResult<ProfitData>>(
    "get",
    baseUrlApi(prefix + "profit/gross"),
    { params }
  );
}

// 利润核算 - 净利润分析
export async function getNetProfitApi(params?: {
  startDate?: string;
  endDate?: string;
  groupBy?: "day" | "week" | "month";
}) {
  return await http.request<CommonResult<ProfitData>>(
    "get",
    baseUrlApi(prefix + "profit/net"),
    { params }
  );
}

// 资金报表 - 收支汇总
export async function getIncomeExpenseSummaryApi(params?: {
  startDate?: string;
  endDate?: string;
}) {
  return await http.request<CommonResult<FinanceSummary>>(
    "get",
    baseUrlApi(prefix + "finance/summary"),
    { params }
  );
}

// 资金报表 - 现金流分析
export async function getCashFlowApi(params?: {
  startDate?: string;
  endDate?: string;
  groupBy?: "day" | "week" | "month";
}) {
  return await http.request<CommonResult<TrendData>>(
    "get",
    baseUrlApi(prefix + "finance/cashflow"),
    { params }
  );
}

// 资金报表 - 账户余额趋势
export async function getBalanceTrendApi(params?: {
  startDate?: string;
  endDate?: string;
  paymentUid?: string;
}) {
  return await http.request<CommonResult<TrendData>>(
    "get",
    baseUrlApi(prefix + "finance/balance-trend"),
    { params }
  );
}
