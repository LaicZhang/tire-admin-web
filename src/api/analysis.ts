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

export interface TrackingSummary {
  pending: number;
  partial: number;
  completed: number;
}

export interface PurchaseOrderTrackingItem {
  id: number;
  uid?: string;
  number: string;
  providerName: string;
  operatorName: string;
  total: string;
  totalOrdered: number;
  logisticsStatus?: unknown;
  trackingStatus: "pending" | "partial" | "completed";
  isApproved: boolean;
  createAt?: string;
}

export interface PurchaseOrderTrackingData {
  count: number;
  list: PurchaseOrderTrackingItem[];
  summary: TrackingSummary;
}

export interface ProviderEvaluationItem {
  providerId: string;
  providerName: string;
  totalOrders: number;
  completedOrders: number;
  onTimeOrders: number;
  totalAmount: number;
  totalQuantity: number;
  completionRate: number;
  onTimeRate: number;
  avgDeliveryDays: number;
  score: number;
}

export interface ProviderEvaluationData {
  count: number;
  list: ProviderEvaluationItem[];
  summary: {
    totalProviders: number;
    avgCompletionRate: number;
    avgOnTimeRate: number;
  };
}

export interface SalesOrderTrackingItem {
  id: number;
  uid?: string;
  number: string;
  customerName: string;
  operatorName: string;
  total: string;
  paidAmount: string;
  totalOrdered: number;
  logisticsStatus?: unknown;
  trackingStatus: "pending" | "partial" | "completed";
  isApproved: boolean;
  createAt?: string;
}

export interface SalesOrderTrackingData {
  count: number;
  list: SalesOrderTrackingItem[];
  summary: TrackingSummary;
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
  buckets?: Array<{
    label?: string;
    bucket?: string;
    count?: number;
    quantity?: number;
    percentage?: number;
  }>;
}

export interface StockoutData {
  list?: Array<{ name: string; currentStock: number; minStock: number }>;
  items?: Array<{
    tireName?: string;
    currentQuantity?: number;
    safetyStock?: number;
    suggestPurchase?: number;
  }>;
}

export interface DotAgingItem {
  repoId: string;
  repoName: string;
  tireId: string;
  tireName: string;
  dotYear: number;
  dotWeek: number;
  dotCode?: string | null;
  count: number;
}

export interface InventoryMovementItem {
  tireId: string;
  tireName: string;
  spec?: string;
  beginQty: number;
  beginAmount: string;
  inQty: number;
  inAmount: string;
  outQty: number;
  outAmount: string;
  endQty: number;
  endAmount: string;
}

export interface InventoryMovementData {
  items: InventoryMovementItem[];
  totalBeginQty: number;
  totalBeginAmount: string;
  totalInQty: number;
  totalInAmount: string;
  totalOutQty: number;
  totalOutAmount: string;
  totalEndQty: number;
  totalEndAmount: string;
}

export interface SerialTraceData {
  summary?: {
    serialNo?: string | null;
    status?: string | null;
    repoId?: string | null;
    sourceType?: string | null;
    sourceOrderId?: string | null;
    targetType?: string | null;
    targetOrderId?: string | null;
    installation?: {
      vehiclePlateNo?: string | null;
      vehicleModel?: string | null;
      installPosition?: string | null;
      installedAt?: string | null;
      mileageKm?: number | null;
      technicianName?: string | null;
      storeRepoId?: string | null;
      storeRepoName?: string | null;
    } | null;
    warranty?: {
      startAt?: string | null;
      endAt?: string | null;
    } | null;
  } | null;
  logs?: Array<{
    action?: string;
    fromRepoId?: string | null;
    toRepoId?: string | null;
    orderType?: string | null;
    orderId?: string | null;
    createdAt?: string | null;
  }>;
  claims?: Array<{
    orderId?: string;
    claimType?: number | null;
    oldTireDisposition?: string | null;
    oldTireRemark?: string | null;
    identificationResult?: string | null;
    createAt?: string | null;
  }>;
}

// 销售汇总
export async function getSalesSummaryApi(params?: {
  startDate?: string;
  endDate?: string;
  storeId?: string;
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
  storeId?: string;
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
  storeId?: string;
}) {
  return await http.request<CommonResult<PurchaseSummary>>(
    "get",
    baseUrlApi(prefix + "purchase/summary"),
    { params }
  );
}

export async function getPurchaseTrendApi(params?: {
  startDate?: string;
  endDate?: string;
  storeId?: string;
  groupBy?: "day" | "week" | "month";
}) {
  return await http.request<CommonResult<TrendData>>(
    "get",
    baseUrlApi(prefix + "purchase/trend"),
    { params }
  );
}

// 库存汇总
export async function getInventorySummaryApi(params?: { repoId?: string }) {
  return await http.request<CommonResult<InventorySummary>>(
    "get",
    baseUrlApi(prefix + "inventory/summary"),
    { params }
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
  storeId?: string;
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
  storeId?: string;
  limit?: number;
}) {
  return await http.request<CommonResult<RankingData>>(
    "get",
    baseUrlApi(prefix + "ranking/providers"),
    { params }
  );
}

export async function getPurchaseOrderTrackingApi(params?: {
  index?: number;
  pageSize?: number;
  startDate?: string;
  endDate?: string;
  status?: "pending" | "partial" | "completed";
  providerId?: string;
}) {
  return await http.request<CommonResult<PurchaseOrderTrackingData>>(
    "get",
    baseUrlApi(prefix + "purchase/order-tracking"),
    { params }
  );
}

export async function getProviderEvaluationApi(params?: {
  startDate?: string;
  endDate?: string;
  providerId?: string;
}) {
  return await http.request<CommonResult<ProviderEvaluationData>>(
    "get",
    baseUrlApi(prefix + "purchase/provider-evaluation"),
    { params }
  );
}

// 商品排行榜
export async function getProductRankingApi(params?: {
  startDate?: string;
  endDate?: string;
  storeId?: string;
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
  storeId?: string;
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

export async function getSalesOrderTrackingApi(params?: {
  index?: number;
  pageSize?: number;
  startDate?: string;
  endDate?: string;
  status?: "pending" | "partial" | "completed";
  customerId?: string;
}) {
  return await http.request<CommonResult<SalesOrderTrackingData>>(
    "get",
    baseUrlApi(prefix + "sales/order-tracking"),
    { params }
  );
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
export async function getSlowMovingApi(params?: {
  days?: number;
  repoId?: string;
}) {
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
export async function getStockoutApi(params?: { repoId?: string }) {
  return await http.request<CommonResult<StockoutData>>(
    "get",
    baseUrlApi(prefix + "stockout"),
    { params }
  );
}

export async function getDotAgingApi(params?: {
  repoId?: string;
  tireId?: string;
}) {
  return await http.request<CommonResult<{ list: DotAgingItem[] }>>(
    "get",
    baseUrlApi(prefix + "inventory/dot-aging"),
    { params }
  );
}

export async function getInventoryMovementApi(params?: {
  startDate?: string;
  endDate?: string;
  repoId?: string;
  storeId?: string;
  tireId?: string;
}) {
  return await http.request<CommonResult<InventoryMovementData>>(
    "get",
    baseUrlApi(prefix + "inventory/movement"),
    { params }
  );
}

export async function getSerialTraceApi(serialNo: string) {
  return await http.request<CommonResult<SerialTraceData>>(
    "get",
    baseUrlApi(
      prefix + `inventory/serial-trace/${encodeURIComponent(serialNo)}`
    )
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
