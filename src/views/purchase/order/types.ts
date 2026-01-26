/** Purchase Order Module Types */

export interface PurchaseOrderDetail {
  uid?: string;
  tireId: string;
  tireName?: string;
  count: number;
  unitPrice: number;
  total: number;
  repoId?: string;
  repoName?: string;
  batchNo?: string;
  expiryDate?: string;
  isArrival: boolean;
  desc?: string;
}

export interface PurchaseOrder {
  id?: number;
  uid: string;
  number?: string;
  providerId: string;
  providerName?: string;
  operatorId?: string;
  operatorName?: string;
  auditorId?: string;
  auditorName?: string;
  count: number;
  total: number;
  showTotal: number;
  paidAmount: number;
  status: boolean;
  orderStatus: number;
  logisticsStatus: number;
  isApproved: boolean;
  isLocked: boolean;
  isReversed?: boolean;
  rejectReason?: string;
  paymentId?: string;
  auditAt?: string;
  arrivalAt?: string;
  payAt?: string;
  createdAt?: string;
  updatedAt?: string;
  desc?: string;
  details: PurchaseOrderDetail[];
  provider?: { name: string };
  operator?: { name: string };
  auditor?: { name: string };
}

export interface PurchaseOrderQueryParams {
  operatorId?: string;
  auditorId?: string;
  providerId?: string;
  isApproved?: boolean;
  status?: boolean;
  startDate?: string;
  endDate?: string;
  keyword?: string;
  desc?: string;
}

export interface PurchaseOrderFormProps {
  formInline: PurchaseOrder;
}

export interface OptionItem {
  uid: string;
  name: string;
}

export const ORDER_STATUS_MAP: Record<number, string> = {
  0: "草稿",
  1: "待审核",
  2: "已审核",
  3: "已完成",
  4: "已关闭"
};

export const LOGISTICS_STATUS_MAP: Record<number, string> = {
  0: "待发货",
  1: "部分发货",
  2: "已发货",
  3: "已到货",
  4: "已取消"
};
