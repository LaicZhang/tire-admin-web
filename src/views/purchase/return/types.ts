/** Purchase Return Order (采购退货单) Module Types */

export interface ReturnOrderDetail {
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

export interface ReturnOrder {
  id?: number;
  uid: string;
  number?: string;
  sourceOrderId?: string;
  sourceOrderNumber?: string;
  providerId: string;
  providerName?: string;
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
  details: ReturnOrderDetail[];
  provider?: { name: string };
  operator?: { name: string };
  auditor?: { name: string };
}

export interface ReturnOrderQueryParams {
  operatorId?: string;
  auditorId?: string;
  providerId?: string;
  sourceOrderId?: string;
  isApproved?: boolean;
  status?: boolean;
  startDate?: string;
  endDate?: string;
  keyword?: string;
  desc?: string;
}

export interface ReturnOrderFormProps {
  formInline: ReturnOrder;
}

export const RETURN_REASON_OPTIONS = [
  { label: "质量问题", value: "quality" },
  { label: "规格不符", value: "spec_mismatch" },
  { label: "数量错误", value: "quantity_error" },
  { label: "损坏", value: "damaged" },
  { label: "其他", value: "other" }
];
