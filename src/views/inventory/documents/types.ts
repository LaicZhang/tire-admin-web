import type { DocumentCenterType } from "@/api/document-center";

export type InventoryDocumentType = Extract<
  DocumentCenterType,
  | "INVENTORY_TRANSFER"
  | "STOCKTAKING"
  | "OTHER_INBOUND"
  | "OTHER_OUTBOUND"
  | "ASSEMBLY"
  | "DISASSEMBLY"
  | "COST_ADJUST"
>;

export enum DocumentType {
  TRANSFER = "INVENTORY_TRANSFER",
  STOCKTAKING = "STOCKTAKING",
  OTHER_INBOUND = "OTHER_INBOUND",
  OTHER_OUTBOUND = "OTHER_OUTBOUND",
  ASSEMBLY = "ASSEMBLY",
  DISASSEMBLY = "DISASSEMBLY",
  COST_ADJUST = "COST_ADJUST"
}

export enum DocumentStatus {
  DRAFT = "DRAFT",
  PENDING = "PENDING",
  APPROVED = "APPROVED",
  REJECTED = "REJECTED",
  COMPLETED = "COMPLETED",
  CANCELLED = "CANCELLED",
  VOID = "VOID"
}

export interface InventoryDocument {
  id: number;
  uid: string;
  billNo?: string;
  documentType?: InventoryDocumentType;
  orderNumber?: string;
  type?: InventoryDocumentType;
  targetName?: string;
  amount?: number;
  totalAmount?: number;
  count?: number;
  totalQuantity?: number;
  status: string;
  isApproved?: boolean;
  operatorName?: string;
  auditorName?: string;
  remark?: string;
  orderDate?: string;
  createdAt?: string;
}

export interface DocumentQuery {
  documentType?: InventoryDocumentType;
  status?: string;
  startDate?: string;
  endDate?: string;
  keyword?: string;
}

export const documentTypeMap: Record<
  InventoryDocumentType,
  {
    label: string;
    color: "primary" | "success" | "warning" | "danger" | "info";
  }
> = {
  INVENTORY_TRANSFER: { label: "调拨单", color: "primary" },
  STOCKTAKING: { label: "盘点单", color: "success" },
  OTHER_INBOUND: { label: "其他入库单", color: "warning" },
  OTHER_OUTBOUND: { label: "其他出库单", color: "danger" },
  ASSEMBLY: { label: "组装单", color: "info" },
  DISASSEMBLY: { label: "拆卸单", color: "info" },
  COST_ADJUST: { label: "成本调整单", color: "info" }
};

export const documentTypeOptions = Object.entries(documentTypeMap).map(
  ([value, config]) => ({
    value: value as InventoryDocumentType,
    label: config.label
  })
);

export const documentStatusMap: Record<
  string,
  { label: string; type: "info" | "warning" | "success" | "danger" }
> = {
  DRAFT: { label: "草稿", type: "info" },
  APPROVED: { label: "已审核", type: "success" },
  REJECTED: { label: "已拒绝", type: "danger" },
  VOID: { label: "已作废", type: "info" },
  IN_PROGRESS: { label: "进行中", type: "warning" },
  COMPLETED: { label: "已完成", type: "success" },
  CANCELLED: { label: "已取消", type: "info" }
};

export const documentStatusOptions = Object.entries(documentStatusMap).map(
  ([value, config]) => ({
    value,
    label: config.label
  })
);

export const approvableDocumentTypes = new Set<InventoryDocumentType>([
  "INVENTORY_TRANSFER",
  "STOCKTAKING",
  "OTHER_INBOUND",
  "OTHER_OUTBOUND",
  "ASSEMBLY",
  "DISASSEMBLY",
  "COST_ADJUST"
]);

export const reversibleDocumentTypes = new Set<InventoryDocumentType>([
  "STOCKTAKING",
  "OTHER_INBOUND",
  "OTHER_OUTBOUND",
  "COST_ADJUST"
]);

export const reverseReasonRequiredTypes = new Set<InventoryDocumentType>([
  "OTHER_INBOUND",
  "OTHER_OUTBOUND"
]);
