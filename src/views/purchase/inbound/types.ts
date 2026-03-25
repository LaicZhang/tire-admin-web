import type { SerialNumberPayload } from "@/utils/serialNumber";

/** Purchase Inbound (采购入库) Module Types */

export type InboundSourceMode = "MANUAL" | "PO_LINKED";

export const INBOUND_SOURCE_MODE_LABELS: Record<InboundSourceMode, string> = {
  MANUAL: "手工新增",
  PO_LINKED: "采购订单生成"
};

export interface InboundOrderDetail {
  uid?: string;
  tireId: string;
  tireName?: string;
  count: number;
  unitPrice: number;
  total: number;
  repoId?: string;
  repoName?: string;
  batchNo?: string;
  productionDate?: string;
  expiryDate?: string;
  serialNumbers?: SerialNumberPayload[];
  serialNosText?: string;
  sourcePurchaseOrderDetailId?: string;
  desc?: string;
}

export interface InboundOrder {
  id?: number;
  uid: string;
  number?: string | number;
  docNo?: string;
  providerId: string;
  providerName?: string;
  operatorId?: string;
  operatorName?: string;
  auditorId?: string;
  auditorName?: string;
  sourceMode?: InboundSourceMode;
  sourcePurchaseOrderId?: string;
  count: number;
  total: number;
  showTotal: number;
  paidAmount: number;
  status: boolean;
  isApproved: boolean;
  isLocked: boolean;
  rejectReason?: string;
  paymentId?: string;
  auditAt?: string;
  createdAt?: string;
  updatedAt?: string;
  desc?: string;
  details: InboundOrderDetail[];
  provider?: { name: string };
  operator?: { name: string };
  auditor?: { name: string };
  sourcePurchaseOrder?: {
    uid?: string;
    docNo?: string;
    number?: string | number;
  };
}

export interface InboundOrderQueryParams {
  operatorId?: string;
  auditorId?: string;
  providerId?: string;
  sourcePurchaseOrderId?: string;
  sourceMode?: InboundSourceMode;
  isApproved?: boolean;
  status?: boolean;
  startDate?: string;
  endDate?: string;
  keyword?: string;
  desc?: string;
  [key: string]: unknown;
}

export interface InboundOrderFormProps {
  formInline: InboundOrder;
}
