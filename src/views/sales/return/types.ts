import type { SerialNumberPayload } from "@/utils/serialNumber";

/** Sales Return Order (销售退货) Module Types */

export interface ReturnOfficialAllocation {
  invoiceUid: string;
  amount: number;
}

export interface ReturnableSource {
  deliveryNoteLineUid: string;
  deliveryNoteUid: string;
  deliveryNoteNo: string;
  tireId: string;
  tireName: string;
  repoId: string;
  repoName: string;
  quantity: number;
  returnedQuantity: number;
  remainingQuantity: number;
  unitPrice: number;
  totalAmount: number;
  remainingAmount: number;
  shippedAt: string;
  invoicedAmount: number;
}

export interface SalesReturnDetail {
  uid?: string;
  tireId: string;
  tireName?: string;
  count: number;
  unitPrice: number;
  total: number;
  repoId?: string;
  repoName?: string;
  sourceDeliveryNoteLineUid?: string;
  officialAllocations?: ReturnOfficialAllocation[];
  returnReason?: string;
  serialNumbers?: SerialNumberPayload[];
  serialNosText?: string;
  qcStatus?: "PENDING" | "PARTIAL" | "COMPLETED";
  qcCompletedAt?: string;
  inspectionSummary?: {
    totalCount: number;
    inspectedCount: number;
    pendingCount: number;
    goodReturnCount: number;
    defectiveCount: number;
    scrappedCount: number;
  };
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
