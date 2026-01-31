/** Sales Return Order (销售退货) Module Types */

export interface SalesReturnDetail {
  uid?: string;
  tireId: string;
  tireName?: string;
  count: number;
  unitPrice: number;
  total: number;
  repoId?: string;
  repoName?: string;
  returnReason?: string;
  desc?: string;
}

export interface SalesReturnOrder {
  id?: number;
  uid: string;
  number?: string;
  sourceOrderId?: string;
  sourceOrderNumber?: string;
  customerId: string;
  customerName?: string;
  operatorId?: string;
  operatorName?: string;
  auditorId?: string;
  auditorName?: string;
  count: number;
  total: number;
  showTotal: number;
  refundAmount: number;
  status: boolean;
  isApproved: boolean;
  isLocked: boolean;
  logisticsStatus: number;
  rejectReason?: string;
  returnReason?: string;
  paymentId?: string;
  auditAt?: string;
  createdAt?: string;
  updatedAt?: string;
  desc?: string;
  details: SalesReturnDetail[];
  customer?: { name: string };
  operator?: { name: string };
  auditor?: { name: string };
  [key: string]: unknown;
}

export interface SalesReturnQueryParams {
  operatorId?: string;
  auditorId?: string;
  customerId?: string;
  sourceOrderId?: string;
  isApproved?: boolean;
  status?: boolean;
  startDate?: string;
  endDate?: string;
  keyword?: string;
  desc?: string;
}

export interface SalesReturnFormProps {
  formInline: SalesReturnOrder;
}

export const RETURN_REASON_OPTIONS = [
  { label: "质量问题", value: "quality" },
  { label: "规格不符", value: "spec_mismatch" },
  { label: "客户取消", value: "customer_cancel" },
  { label: "发货错误", value: "shipping_error" },
  { label: "其他", value: "other" }
];
