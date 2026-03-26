import { http } from "@/utils/http";
import { baseUrlApi } from "../utils";
import type { CommonResult } from "../type";

export type InvoiceBusinessType = "SALE" | "PURCHASE";
export type InvoiceStatus = "draft" | "issued" | "cancelled";
export type InvoiceRole = "BLUE" | "RED";
export type InvoiceRedFlushStatus = "NONE" | "PARTIAL" | "FULL";

export interface InvoiceRelationSummary {
  uid: string;
  invoiceNumber: string;
  invoiceRole?: InvoiceRole;
  status?: InvoiceStatus;
  totalAmount?: number;
  invoiceDate?: string;
  redFlushedAt?: string;
}

export interface DeliveryLineLinkRow {
  uid: string;
  saleDeliveryNoteUid: string;
  saleDeliveryNoteLineUid: string;
  saleOrderId: string;
  saleOrderDetailId: string;
  quantity: number;
  amount: number;
  taxAmount: number;
  totalAmount: number;
}

export interface InvoiceRow {
  uid: string;
  businessType: InvoiceBusinessType;
  partyType: "CUSTOMER" | "PROVIDER";
  statementType: "RECEIVABLE" | "PAYABLE";
  invoiceRole: InvoiceRole;
  status: InvoiceStatus;
  redFlushStatus?: InvoiceRedFlushStatus;
  invoiceNumber: string;
  invoiceType: string;
  invoiceDate: string;
  amount: number;
  taxAmount: number;
  totalAmount: number;
  partyId: string;
  partyName: string;
  statementId: string;
  statementNo: string;
  deliveryNoteId?: string;
  purchaseInboundId?: string;
  statementStatus?: string;
  remark?: string;
  items?: unknown;
  issuedAt?: string;
  cancelledAt?: string;
  cancelReason?: string;
  redFlushedAt?: string;
  redFlushReason?: string;
  sourceInvoiceId?: string;
  sourceInvoiceNumber?: string;
  sourceInvoice?: InvoiceRelationSummary;
  redFlushInvoices?: InvoiceRelationSummary[];
  deliveryLineLinks?: DeliveryLineLinkRow[];
  createdAt: string;
  trace?: {
    orders: Array<{
      uid: string;
      docNo: string;
      amount?: number;
      date?: string;
    }>;
    returns: Array<{
      uid: string;
      docNo: string;
      amount?: number;
      date?: string;
    }>;
    fundOrders: Array<{
      uid: string;
      billNo: string;
      amount: number;
      status: string;
      date?: string;
    }>;
  };
}

export interface InvoiceQuery {
  businessType?: InvoiceBusinessType;
  status?: InvoiceStatus;
  invoiceNumber?: string;
  deliveryNoteId?: string;
  purchaseInboundId?: string;
  partyName?: string;
}

export interface CreateInvoicePayload {
  businessType: InvoiceBusinessType;
  deliveryNoteId?: string;
  purchaseInboundId?: string;
  deliveryLineLinks?: Array<{
    saleDeliveryNoteLineUid: string;
    quantity: number;
    amount: number;
    taxAmount: number;
    totalAmount: number;
  }>;
  invoiceNumber: string;
  invoiceType: string;
  invoiceDate: string;
  amount: number;
  taxAmount: number;
  totalAmount: number;
  remark?: string;
}

export interface SaleDeliverySourceLine {
  uid: string;
  saleOrderDetailId: string;
  tireId: string;
  quantity: number;
  totalAmount: number;
  invoicedQuantity: number;
  invoicedAmount: number;
  remainingQuantity: number;
  remainingAmount: number;
}

export interface SaleDeliverySource {
  uid: string;
  deliveryNoteNo: string;
  customerId: string;
  customerName: string;
  totalAmount: number;
  invoicedAmount: number;
  remainingAmount: number;
  shippedAt: string;
  lines: SaleDeliverySourceLine[];
}

export interface PurchaseInboundSource {
  uid: string;
  docNo: string;
  providerId: string;
  providerName: string;
  totalAmount: number;
  invoicedAmount: number;
  remainingAmount: number;
  auditAt?: string;
}

export interface RedFlushInvoicePayload {
  invoiceNumber: string;
  invoiceType: string;
  invoiceDate: string;
  amount: number;
  taxAmount: number;
  totalAmount: number;
  redFlushReason: string;
  remark?: string;
}

export function getInvoicePage(index = 1, params?: InvoiceQuery) {
  return http.request<CommonResult<{ total: number; list: InvoiceRow[] }>>(
    "get",
    baseUrlApi(`/invoice/page/${index}`),
    {
      params
    }
  );
}

export function getSaleDeliverySources() {
  return http.request<CommonResult<SaleDeliverySource[]>>(
    "get",
    baseUrlApi("/ar-temp")
  );
}

export function getPurchaseInboundSources() {
  return http.request<CommonResult<PurchaseInboundSource[]>>(
    "get",
    baseUrlApi("/invoice/purchase-inbound-sources")
  );
}

export function getInvoiceDetail(uid: string) {
  return http.request<CommonResult<InvoiceRow>>(
    "get",
    baseUrlApi(`/invoice/${uid}`)
  );
}

export function createInvoice(data: CreateInvoicePayload) {
  return http.request<CommonResult<InvoiceRow>>(
    "post",
    baseUrlApi("/invoice"),
    {
      data
    }
  );
}

export function issueInvoice(uid: string, issuedAt?: string) {
  return http.request<CommonResult<InvoiceRow>>(
    "post",
    baseUrlApi(`/invoice/${uid}/issue`),
    {
      data: issuedAt ? { issuedAt } : {}
    }
  );
}

export function cancelInvoice(uid: string, cancelReason: string) {
  return http.request<CommonResult<InvoiceRow>>(
    "post",
    baseUrlApi(`/invoice/${uid}/cancel`),
    {
      data: { cancelReason }
    }
  );
}

export function redFlushInvoice(uid: string, data: RedFlushInvoicePayload) {
  return http.request<CommonResult<InvoiceRow>>(
    "post",
    baseUrlApi(`/invoice/${uid}/red-flush`),
    {
      data
    }
  );
}
