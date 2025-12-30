// 库存单据列表类型定义

export enum DocumentType {
  TRANSFER = "transfer",
  STOCKTAKING = "stocktaking",
  OTHER_INBOUND = "other_inbound",
  OTHER_OUTBOUND = "other_outbound",
  ASSEMBLY = "assembly",
  DISASSEMBLY = "disassembly",
  COST_ADJUST = "cost_adjust"
}

export const documentTypeMap: Record<
  DocumentType,
  { label: string; color: string }
> = {
  [DocumentType.TRANSFER]: { label: "调拨单", color: "#409eff" },
  [DocumentType.STOCKTAKING]: { label: "盘点单", color: "#67c23a" },
  [DocumentType.OTHER_INBOUND]: { label: "其他入库单", color: "#e6a23c" },
  [DocumentType.OTHER_OUTBOUND]: { label: "其他出库单", color: "#f56c6c" },
  [DocumentType.ASSEMBLY]: { label: "组装单", color: "#909399" },
  [DocumentType.DISASSEMBLY]: { label: "拆卸单", color: "#9c27b0" },
  [DocumentType.COST_ADJUST]: { label: "成本调整单", color: "#00bcd4" }
};

export enum DocumentStatus {
  DRAFT = "draft",
  PENDING = "pending",
  APPROVED = "approved",
  REJECTED = "rejected",
  COMPLETED = "completed",
  CANCELLED = "cancelled"
}

export const documentStatusMap: Record<
  DocumentStatus,
  { label: string; type: "info" | "warning" | "success" | "danger" }
> = {
  [DocumentStatus.DRAFT]: { label: "草稿", type: "info" },
  [DocumentStatus.PENDING]: { label: "待审核", type: "warning" },
  [DocumentStatus.APPROVED]: { label: "已审核", type: "success" },
  [DocumentStatus.REJECTED]: { label: "已拒绝", type: "danger" },
  [DocumentStatus.COMPLETED]: { label: "已完成", type: "success" },
  [DocumentStatus.CANCELLED]: { label: "已取消", type: "info" }
};

export interface InventoryDocument {
  id: number;
  uid: string;
  orderNumber: string;
  type: DocumentType;
  status: DocumentStatus;
  isApproved: boolean;
  operatorName?: string;
  auditorName?: string;
  totalAmount?: number;
  totalQuantity?: number;
  orderDate: string;
  createdAt: string;
  remark?: string;
}

export interface DocumentQuery {
  type?: DocumentType;
  status?: DocumentStatus;
  startDate?: string;
  endDate?: string;
  keyword?: string;
}
