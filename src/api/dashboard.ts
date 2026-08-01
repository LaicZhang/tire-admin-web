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

export interface RoleDashboardProfile {
  key: string;
  label: string;
  description: string;
  homeTitle: string;
  roles: string[];
}

export interface RoleDashboardCard {
  key: string;
  title: string;
  value: string;
  tone?: "primary" | "info" | "success" | "warning" | "danger";
  targetPath?: string;
}

export interface RoleDashboardTodoItem {
  key: string;
  label: string;
  value: string;
  level: "info" | "warning" | "danger";
  module: "store" | "sales" | "purchase" | "inventory";
  targetPath: string;
}

export interface RoleDashboardSection {
  key: "store" | "sales" | "purchase" | "inventory";
  title: string;
  targetPath: string;
  summaryCards: RoleDashboardCard[];
  trend: DashboardTrendItem[];
  ranking: DashboardRankingItem[];
  alerts: DashboardAlertItem[];
}

export interface RoleDashboardData {
  roleProfile: RoleDashboardProfile;
  filters: DashboardOverviewFilters;
  visibleModuleKeys: string[];
  focusCards: RoleDashboardCard[];
  todoItems: RoleDashboardTodoItem[];
  sections: RoleDashboardSection[];
}

export type TraceWorkbenchModule =
  | "sales"
  | "purchase"
  | "inventory"
  | "finance"
  | "rollback";

export type TraceWorkbenchSeverity = "info" | "warning" | "danger" | "success";

export type TraceWorkbenchStatus =
  | "open"
  | "investigating"
  | "rollbackRecommended"
  | "resolved";

export type TraceWorkbenchIncidentType =
  | "salesAnomaly"
  | "purchaseAnomaly"
  | "inventoryAnomaly"
  | "financeAnomaly"
  | "rollbackFocus";

export interface TraceWorkbenchSummary {
  openIncidentCount: number;
  highRiskCount: number;
  rollbackRecommendedCount: number;
  resolvedTodayCount: number;
}

export interface TraceWorkbenchIncident {
  incidentId: string;
  title: string;
  module: TraceWorkbenchModule;
  incidentType: TraceWorkbenchIncidentType;
  severity: TraceWorkbenchSeverity;
  status: TraceWorkbenchStatus;
  occurredAt: string;
  operatorName: string;
  storeName?: string;
  repoName?: string;
  primaryDocumentNo?: string;
  traceId?: string;
  summary: string;
}

export interface TraceWorkbenchDocument {
  type: string;
  id: string;
  no: string;
  label: string;
  targetPath?: string;
}

export interface TraceWorkbenchTimelineItem {
  time: string;
  action: string;
  operatorName: string;
  result: string;
  remark?: string;
}

export interface TraceWorkbenchImpact {
  inventoryDelta?: string;
  amountDelta?: string;
  affectedOrderCount?: number;
  affectedSkuCount?: number;
}

export interface TraceWorkbenchActions {
  canPreviewRollback: boolean;
  canExecuteRollback: boolean;
  canOpenLogDetail: boolean;
}

export interface TraceWorkbenchIncidentDetail {
  incidentId: string;
  title: string;
  module: TraceWorkbenchModule;
  incidentType: TraceWorkbenchIncidentType;
  severity: TraceWorkbenchSeverity;
  status: TraceWorkbenchStatus;
  occurredAt: string;
  operatorName: string;
  traceId?: string;
  summary: string;
  reasonHint?: string;
}

export interface TraceWorkbenchListResponse {
  summary: TraceWorkbenchSummary;
  list: TraceWorkbenchIncident[];
  total: number;
  page?: number;
  pageSize?: number;
}

export interface TraceWorkbenchDetailResponse {
  incident: TraceWorkbenchIncidentDetail;
  documents: TraceWorkbenchDocument[];
  timeline: TraceWorkbenchTimelineItem[];
  impact: TraceWorkbenchImpact;
  actions: TraceWorkbenchActions;
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

export async function getRoleHomeApi(params?: {
  startDate?: string;
  endDate?: string;
  storeId?: string;
  repoId?: string;
}) {
  return await http.request<CommonResult<RoleDashboardData>>(
    "get",
    baseUrlApi(dashboardPrefix + "role-home"),
    { params }
  );
}

export async function getRoleOverviewApi(params?: {
  startDate?: string;
  endDate?: string;
  storeId?: string;
  repoId?: string;
}) {
  return await http.request<CommonResult<RoleDashboardData>>(
    "get",
    baseUrlApi(dashboardPrefix + "role-overview"),
    { params }
  );
}

export async function getTraceWorkbenchListApi(
  page: number,
  params?: {
    startDate?: string;
    endDate?: string;
    storeId?: string;
    repoId?: string;
    module?: string;
    incidentType?: string;
    status?: string;
    keyword?: string;
    pageSize?: number;
  }
) {
  return await http.request<CommonResult<TraceWorkbenchListResponse>>(
    "get",
    baseUrlApi(dashboardPrefix + "trace-workbench"),
    {
      params: {
        page,
        ...params
      }
    }
  );
}

export async function getTraceWorkbenchDetailApi(incidentId: string) {
  return await http.request<CommonResult<TraceWorkbenchDetailResponse>>(
    "get",
    baseUrlApi(
      dashboardPrefix + `trace-workbench/${encodeURIComponent(incidentId)}`
    )
  );
}
