// 库存报表类型定义

export enum ReportType {
  BALANCE = "balance",
  DETAIL = "detail",
  SUMMARY = "summary",
  SERIAL_TRACKING = "serial_tracking",
  SERIAL_STATUS = "serial_status",
  BATCH_TRACKING = "batch_tracking",
  BATCH_STATUS = "batch_status",
  EXPIRY_ALERT = "expiry_alert"
}

export const reportTypeMap: Record<
  ReportType,
  { label: string; desc: string }
> = {
  [ReportType.BALANCE]: {
    label: "商品库存余额表",
    desc: "查看各仓库商品库存余额"
  },
  [ReportType.DETAIL]: { label: "商品收发明细表", desc: "查看商品出入库明细" },
  [ReportType.SUMMARY]: {
    label: "商品收发汇总表",
    desc: "查看商品收发汇总数据"
  },
  [ReportType.SERIAL_TRACKING]: {
    label: "序列号跟踪表",
    desc: "跟踪序列号流向"
  },
  [ReportType.SERIAL_STATUS]: {
    label: "序列号状态表",
    desc: "查看序列号当前状态"
  },
  [ReportType.BATCH_TRACKING]: { label: "批次跟踪表", desc: "跟踪批次流向" },
  [ReportType.BATCH_STATUS]: { label: "批次状态表", desc: "查看批次当前状态" },
  [ReportType.EXPIRY_ALERT]: { label: "保质期预警表", desc: "查看即将过期商品" }
};

export interface InventoryBalance {
  id: number;
  tireId: string;
  tireName: string;
  tireBarcode?: string;
  repoId: string;
  repoName: string;
  quantity: number;
  unitCost: number;
  totalCost: number;
  lastInboundDate?: string;
  lastOutboundDate?: string;
}

export interface InventoryDetail {
  id: number;
  orderNumber: string;
  orderType: string;
  tireId: string;
  tireName: string;
  repoId: string;
  repoName: string;
  quantity: number;
  direction: "in" | "out";
  unitCost: number;
  totalCost: number;
  operatorName?: string;
  orderDate: string;
  remark?: string;
}

export interface InventorySummary {
  tireId: string;
  tireName: string;
  tireBarcode?: string;
  repoId?: string;
  repoName?: string;
  openingQuantity: number;
  openingCost: number;
  inboundQuantity: number;
  inboundCost: number;
  outboundQuantity: number;
  outboundCost: number;
  closingQuantity: number;
  closingCost: number;
}

export interface ReportQuery {
  repoId?: string;
  tireId?: string;
  startDate?: string;
  endDate?: string;
  showZeroStock?: boolean;
  showNegativeStock?: boolean;
  showDisabledRepo?: boolean;
}
