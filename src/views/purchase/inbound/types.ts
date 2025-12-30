/** Purchase Inbound (采购入库) Module Types */

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
  desc?: string;
}

export interface InboundOrder {
  id?: number;
  uid: string;
  number?: string;
  purchaseOrderId?: string;
  purchaseOrderNumber?: string;
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
  purchaseOrder?: { number: string };
}

export interface InboundOrderQueryParams {
  operatorId?: string;
  auditorId?: string;
  providerId?: string;
  purchaseOrderId?: string;
  isApproved?: boolean;
  status?: boolean;
  startDate?: string;
  endDate?: string;
  keyword?: string;
  desc?: string;
}

export interface InboundOrderFormProps {
  formInline: InboundOrder;
}
