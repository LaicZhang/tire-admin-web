import { http } from "@/utils/http";
import { baseUrlApi } from "../utils";
import type { CommonResult } from "../type";

export type InvoiceBusinessType = "SALE" | "PURCHASE";
export type InvoiceStatus = "draft" | "issued" | "cancelled";

export interface InvoiceRow {
  uid: string;
  businessType: InvoiceBusinessType;
  partyType: "CUSTOMER" | "PROVIDER";
  statementType: "RECEIVABLE" | "PAYABLE";
  status: InvoiceStatus;
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
  statementStatus?: string;
  remark?: string;
  items?: unknown;
  issuedAt?: string;
  cancelledAt?: string;
  cancelReason?: string;
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
  statementId?: string;
  partyName?: string;
}

export interface CreateInvoicePayload {
  businessType: InvoiceBusinessType;
  statementId: string;
  invoiceNumber: string;
  invoiceType: string;
  invoiceDate: string;
  amount: number;
  taxAmount: number;
  totalAmount: number;
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
