import type { SerialNumberPayload } from "@/utils/serialNumber";

/** Sales Order Module Types */

export interface SalesOrderDetail {
  uid?: string;
  tireId: string;
  tireName?: string;
  count: number;
  unitPrice: number;
  total: number;
  repoId?: string;
  repoName?: string;
  discountRate?: number;
  discountAmount?: number;
  isShipped: boolean;
  isDelivered: boolean;
  serialNumbers?: SerialNumberPayload[];
  serialNosText?: string;
  dotCodeMin?: string | null;
  dotCodeMax?: string | null;
  dotRequirementRemark?: string | null;
  desc?: string;
}

export interface SalesOrder {
  id?: number;
  uid: string;
  number?: string;
  customerId: string;
  customerName?: string;
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
  shipAt?: string;
  deliveryAt?: string;
  payAt?: string;
  createdAt?: string;
  updatedAt?: string;
  desc?: string;
  details: SalesOrderDetail[];
  customer?: { name: string };
  operator?: { name: string };
  auditor?: { name: string };
}

export interface SalesOrderQueryParams {
  operatorId?: string;
  auditorId?: string;
  customerId?: string;
  isApproved?: boolean;
  status?: boolean;
  startDate?: string;
  endDate?: string;
  keyword?: string;
  desc?: string;
  [key: string]: unknown;
}

export interface SalesOrderFormProps {
  formInline: SalesOrder;
}

export interface OptionItem {
  uid: string;
  name: string;
}

/** @deprecated 使用 PAYMENT_STATUS_MAP / paymentStatusLabel；orderStatus 是支付态非审批态 */
export const ORDER_STATUS_MAP: Record<number, string> = {
  0: "待支付",
  1: "部分支付",
  2: "已付清",
  3: "已取消"
};

/** 支付状态（后端 orderStatus / OrderStatusEnum） */
export const PAYMENT_STATUS_MAP: Record<number, string> = {
  0: "待支付",
  1: "部分支付",
  2: "已付清",
  3: "已取消"
};

/** 单据启停（DB status boolean，非 orderStatus） */
export const DOCUMENT_STATUS_MAP: Record<string, string> = {
  true: "正常",
  false: "已关闭"
};

export const LOGISTICS_STATUS_MAP: Record<number, string> = {
  0: "待发货",
  1: "部分发货",
  2: "已发货",
  3: "已送达",
  4: "已取消"
};
