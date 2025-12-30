/** Sales Outbound (销售出库) Module Types */

export interface OutboundOrderDetail {
  uid?: string;
  tireId: string;
  tireName?: string;
  count: number;
  unitPrice: number;
  total: number;
  repoId?: string;
  repoName?: string;
  batchNo?: string;
  isShipped: boolean;
  shipCount?: number;
  desc?: string;
}

export interface OutboundOrder {
  id?: number;
  uid: string;
  number?: string;
  saleOrderId?: string;
  saleOrderNumber?: string;
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
  logisticsStatus: number;
  isApproved: boolean;
  isLocked: boolean;
  rejectReason?: string;
  paymentId?: string;
  auditAt?: string;
  shipAt?: string;
  createdAt?: string;
  updatedAt?: string;
  desc?: string;
  details: OutboundOrderDetail[];
  customer?: { name: string };
  operator?: { name: string };
  auditor?: { name: string };
  saleOrder?: { number: string };
}

export interface OutboundOrderQueryParams {
  operatorId?: string;
  auditorId?: string;
  customerId?: string;
  saleOrderId?: string;
  isApproved?: boolean;
  status?: boolean;
  startDate?: string;
  endDate?: string;
  keyword?: string;
  desc?: string;
}

export interface OutboundOrderFormProps {
  formInline: OutboundOrder;
}
