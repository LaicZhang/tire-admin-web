import type { InventoryMovementData, TrackingSummary } from "@/api/analysis";
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
