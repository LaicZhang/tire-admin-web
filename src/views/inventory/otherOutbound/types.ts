// 其他出库单类型定义

export enum OtherOutboundType {
  OTHER_OUTBOUND = "other_outbound",
  WASTE = "waste"
}

export const otherOutboundTypeMap: Record<
  OtherOutboundType,
  { label: string; type: "info" | "danger" }
> = {
  [OtherOutboundType.OTHER_OUTBOUND]: { label: "其他出库", type: "info" },
  [OtherOutboundType.WASTE]: { label: "盘亏出库", type: "danger" }
};

export enum OtherOutboundStatus {
  DRAFT = "draft",
  PENDING = "pending",
  APPROVED = "approved",
  REJECTED = "rejected"
}

export const otherOutboundStatusMap: Record<
  OtherOutboundStatus,
  { label: string; type: "info" | "warning" | "success" | "danger" }
> = {
  [OtherOutboundStatus.DRAFT]: { label: "草稿", type: "info" },
  [OtherOutboundStatus.PENDING]: { label: "待审核", type: "warning" },
  [OtherOutboundStatus.APPROVED]: { label: "已审核", type: "success" },
  [OtherOutboundStatus.REJECTED]: { label: "已拒绝", type: "danger" }
};

export interface OtherOutboundDetail {
  id?: number;
  tireId: string;
  tireName?: string;
  tireBarcode?: string;
  repoId: string;
  repoName?: string;
  quantity: number;
  unitCost: number;
  totalCost?: number;
  remark?: string;
}

export interface OtherOutboundOrder {
  id: number;
  uid: string;
  orderNumber: string;
  type: OtherOutboundType;
  status: OtherOutboundStatus;
  customerId?: string;
  customerName?: string;
  isApproved: boolean;
  isLocked: boolean;
  operatorId?: string;
  operatorName?: string;
  auditorId?: string;
  auditorName?: string;
  orderDate: string;
  approvedAt?: string;
  totalAmount: number;
  totalQuantity: number;
  remark?: string;
  details: OtherOutboundDetail[];
  createdAt: string;
  updatedAt?: string;
}

export interface CreateOtherOutboundDto {
  type: OtherOutboundType;
  customerId?: string;
  orderDate?: string;
  operatorId?: string;
  remark?: string;
  details: Omit<
    OtherOutboundDetail,
    "id" | "tireName" | "tireBarcode" | "repoName" | "totalCost"
  >[];
}

export type UpdateOtherOutboundDto = Partial<CreateOtherOutboundDto>;

export interface OtherOutboundQuery {
  type?: OtherOutboundType;
  status?: OtherOutboundStatus;
  repoId?: string;
  startDate?: string;
  endDate?: string;
  keyword?: string;
}
