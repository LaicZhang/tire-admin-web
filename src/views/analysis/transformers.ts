import type {
  CashFlowReport,
  FundReport,
  IncomeExpenseSummary,
  InventoryMovementData,
  ProfitStatement,
  TrackingSummary
} from "@/api/analysis";
import type { DashboardAlertItem } from "@/api/dashboard";

type DashboardMetricKey =
  | "storeMetrics"
  | "warehouseMetrics"
  | "purchaseMetrics"
  | "salesMetrics";

const DASHBOARD_MODULE_LABELS: Record<DashboardMetricKey, string> = {
  storeMetrics: "门店",
  warehouseMetrics: "库存",
  purchaseMetrics: "采购",
  salesMetrics: "销售"
};

const TRACKING_CARD_CONFIG = [
  { key: "pending", label: "待处理" },
  { key: "partial", label: "处理中" },
  { key: "completed", label: "已完成" }
] as const;

export interface DashboardAlertRow extends DashboardAlertItem {
  module: string;
}

export interface TrackingSummaryCard {
  key: "pending" | "partial" | "completed" | "total";
  label: string;
  value: number;
}

export interface InventoryMovementRow {
  key: "begin" | "in" | "out" | "end";
  label: string;
  quantity: number;
  amount: number;
}

export function buildDashboardAlertRows(
  overview: Record<DashboardMetricKey, { alerts: DashboardAlertItem[] }>
): DashboardAlertRow[] {
  const rows = (
    Object.keys(DASHBOARD_MODULE_LABELS) as DashboardMetricKey[]
  ).flatMap(metricKey =>
    (overview[metricKey].alerts ?? []).map(alert => ({
      ...alert,
      module: DASHBOARD_MODULE_LABELS[metricKey]
    }))
  );

  return rows.sort((left, right) => {
    const levelWeight = { danger: 0, warning: 1, info: 2 };
    return levelWeight[left.level] - levelWeight[right.level];
  });
}

export function buildTrackingSummaryCards(
  summary: TrackingSummary
): TrackingSummaryCard[] {
  const cards = TRACKING_CARD_CONFIG.map(item => ({
    key: item.key,
    label: item.label,
    value: summary[item.key]
  }));

  return [
    ...cards,
    {
      key: "total",
      label: "总数",
      value: cards.reduce((total, item) => total + item.value, 0)
    }
  ];
}

export function buildInventoryMovementRows(
  data: Pick<
    InventoryMovementData,
    | "totalBeginQty"
    | "totalInQty"
    | "totalOutQty"
    | "totalEndQty"
    | "totalBeginAmount"
    | "totalInAmount"
    | "totalOutAmount"
    | "totalEndAmount"
  >
): InventoryMovementRow[] {
  return [
    {
      key: "begin",
      label: "期初",
      quantity: data.totalBeginQty,
      amount: Number(data.totalBeginAmount)
    },
    {
      key: "in",
      label: "入库",
      quantity: data.totalInQty,
      amount: Number(data.totalInAmount)
    },
    {
      key: "out",
      label: "出库",
      quantity: data.totalOutQty,
      amount: Number(data.totalOutAmount)
    },
    {
      key: "end",
      label: "期末",
      quantity: data.totalEndQty,
      amount: Number(data.totalEndAmount)
    }
  ];
}

/** BE money strings are already yuan (e.g. "123.45"). */
export function formatYuanAmount(
  val: string | number | null | undefined
): string {
  const num = Number(val ?? 0);
  if (Number.isNaN(num)) return "0.00";
  return num.toLocaleString("zh-CN", { minimumFractionDigits: 2 });
}

export function toChartNumber(val: string | number | null | undefined): number {
  const num = Number(val ?? 0);
  return Number.isNaN(num) ? 0 : num;
}

export interface FinanceSummaryCards {
  totalIncome: string;
  totalExpense: string;
  netIncome: string;
  /** From fund/report totalEndBalance when available */
  currentBalance: string;
}

export function mapIncomeExpenseSummaryCards(
  data: IncomeExpenseSummary | null | undefined,
  currentBalance = "0"
): FinanceSummaryCards {
  return {
    totalIncome: data?.totalIncome ?? "0",
    totalExpense: data?.totalExpense ?? "0",
    netIncome: data?.netIncome ?? "0",
    currentBalance
  };
}

export interface CashFlowSegmentBar {
  name: string;
  value: number;
}

/** Map CashFlowReportDto to three-segment bar (B9). */
export function mapCashFlowSegments(
  data: CashFlowReport | null | undefined
): CashFlowSegmentBar[] {
  return [
    {
      name: "经营活动",
      value: toChartNumber(data?.operatingCashFlow)
    },
    {
      name: "投资活动",
      value: toChartNumber(data?.investingCashFlow)
    },
    {
      name: "筹资活动",
      value: toChartNumber(data?.financingCashFlow)
    }
  ];
}

export interface BalanceTrendPoint {
  period: string;
  balance: number;
}

/** Derive balance trend from fund/report endBalance (B10). */
export function mapFundReportBalanceTrend(
  data: FundReport | null | undefined
): BalanceTrendPoint[] {
  return (data?.items ?? []).map(item => ({
    period: item.period,
    balance: toChartNumber(item.endBalance)
  }));
}

export interface ProfitSummaryCards {
  salesRevenue: string;
  salesCost: string;
  grossProfit: string;
  operatingExpense: string;
  otherIncome: string;
  netProfit: string;
  grossProfitRate: number;
  salesOrderCount: number;
  unknownCostQuantity: number;
}

export function mapProfitStatementCards(
  data: ProfitStatement | null | undefined
): ProfitSummaryCards {
  return {
    salesRevenue: data?.salesRevenue ?? "0",
    salesCost: data?.salesCost ?? "0",
    grossProfit: data?.grossProfit ?? "0",
    operatingExpense: data?.operatingExpense ?? "0",
    otherIncome: data?.otherIncome ?? "0",
    netProfit: data?.netProfit ?? "0",
    grossProfitRate: data?.grossProfitRate ?? 0,
    salesOrderCount: data?.salesOrderCount ?? 0,
    unknownCostQuantity: data?.unknownCostQuantity ?? 0
  };
}

export interface ProfitWaterfallStep {
  name: string;
  value: number;
  /** cumulative helper for waterfall: 'total' | 'increase' | 'decrease' */
  kind: "total" | "increase" | "decrease";
}

/** Single-period waterfall (C3/E14) when BE has no period trend. */
export function mapProfitWaterfall(
  data: ProfitStatement | null | undefined
): ProfitWaterfallStep[] {
  const revenue = toChartNumber(data?.salesRevenue);
  const cost = toChartNumber(data?.salesCost);
  const gross = toChartNumber(data?.grossProfit);
  const expense = toChartNumber(data?.operatingExpense);
  const other = toChartNumber(data?.otherIncome);
  const net = toChartNumber(data?.netProfit);

  return [
    { name: "销售收入", value: revenue, kind: "total" },
    { name: "销售成本", value: -cost, kind: "decrease" },
    { name: "毛利", value: gross, kind: "total" },
    { name: "营业费用", value: -expense, kind: "decrease" },
    { name: "其他收入", value: other, kind: "increase" },
    { name: "净利润", value: net, kind: "total" }
  ];
}
