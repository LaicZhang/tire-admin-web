// 其他入库单类型定义

export enum OtherInboundType {
  OTHER_INBOUND = "other_inbound",
  SURPLUS = "surplus"
}

export const otherInboundTypeMap: Record<
  OtherInboundType,
  { label: string; type: "info" | "success" }
> = {
  [OtherInboundType.OTHER_INBOUND]: { label: "其他入库", type: "info" },
  [OtherInboundType.SURPLUS]: { label: "盘盈入库", type: "success" }
};

export enum OtherInboundStatus {
  DRAFT = "draft",
  PENDING = "pending",
  APPROVED = "approved",
  REJECTED = "rejected"
}

export const otherInboundStatusMap: Record<
  OtherInboundStatus,
  { label: string; type: "info" | "warning" | "success" | "danger" }
> = {
  [OtherInboundStatus.DRAFT]: { label: "草稿", type: "info" },
  [OtherInboundStatus.PENDING]: { label: "待审核", type: "warning" },
  [OtherInboundStatus.APPROVED]: { label: "已审核", type: "success" },
  [OtherInboundStatus.REJECTED]: { label: "已拒绝", type: "danger" }
};

export interface OtherInboundDetail {
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

export interface OtherInboundOrder {
  id: number;
  uid: string;
  orderNumber: string;
  type: OtherInboundType;
  status: OtherInboundStatus;
  providerId?: string;
  providerName?: string;
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
  details: OtherInboundDetail[];
  createdAt: string;
  updatedAt?: string;
}

export interface CreateOtherInboundDto {
  type: OtherInboundType;
  providerId?: string;
  orderDate?: string;
  operatorId?: string;
  remark?: string;
  details: Omit<
    OtherInboundDetail,
    "id" | "tireName" | "tireBarcode" | "repoName" | "totalCost"
  >[];
}

export type UpdateOtherInboundDto = Partial<CreateOtherInboundDto>;

export interface OtherInboundQuery {
  type?: OtherInboundType;
  status?: OtherInboundStatus;
  repoId?: string;
  startDate?: string;
  endDate?: string;
  keyword?: string;
}
