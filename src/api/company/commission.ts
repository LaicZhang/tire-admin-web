import { http } from "../../utils/http";
import { baseUrlApi } from "../utils";
import type { CommonResult } from "../type";

const prefix = "/commission/";

export type CommissionRecordStatus =
  | "ESTIMATED"
  | "AVAILABLE"
  | "SETTLED"
  | "REVERSED";

export type CommissionPayoutMode = "PAYROLL" | "IMMEDIATE";

export interface CommissionRecord {
  id: number;
  uid: string;
  recordType: "ACCRUAL" | "REVERSAL";
  status: CommissionRecordStatus;
  salespersonId: string;
  saleOrderId: string;
  deliveryNoteUid: string;
  tireId: string;
  shippedQuantity: number;
  commissionBaseAmount: string;
  estimatedAmount: string;
  availableAmount: string;
  settledAmount: string;
  reversalReason?: string | null;
  createdAt: string;
}

export interface CommissionSummary {
  salespersonId: string;
  _count: { _all: number };
  _sum: {
    estimatedAmount: string | null;
    availableAmount: string | null;
    settledAmount: string | null;
  };
}

export type CommissionSettlementStatus =
  | "DRAFT"
  | "PENDING_APPROVAL"
  | "APPROVED"
  | "REVERSED";

export interface CommissionPayoutLink {
  uid: string;
  payoutMode: CommissionPayoutMode;
  payrollRunId?: string | null;
  payrollLineItemId?: string | null;
  otherExpenseOrderUid?: string | null;
  amount: string;
}

export interface CommissionSettlement {
  id: number;
  uid: string;
  salespersonId: string;
  status: CommissionSettlementStatus;
  payoutMode: CommissionPayoutMode;
  totalAmount: string;
  remark?: string | null;
  createdAt: string;
  approvedAt?: string | null;
  reversedAt?: string | null;
  payoutLink?: CommissionPayoutLink | null;
  items: Array<{
    uid: string;
    commissionRecordUid: string;
    amount: string;
  }>;
}

export interface CommissionPage<T> {
  count: number;
  list: T[];
  pageSize: number;
}

export interface CommissionRecordQuery {
  salespersonId?: string;
  saleOrderId?: string;
  status?: CommissionRecordStatus;
}

export interface CreateCommissionSettlementInput {
  salespersonId: string;
  payoutMode: CommissionPayoutMode;
  recordUids?: string[];
  periodStart?: string;
  periodEnd?: string;
  remark?: string;
}

export function getCommissionRecordsApi(
  index: number,
  params?: CommissionRecordQuery
) {
  return http.request<CommonResult<CommissionPage<CommissionRecord>>>(
    "get",
    baseUrlApi(`${prefix}records/page/${index}`),
    { params }
  );
}

export function getCommissionSummaryApi(params?: CommissionRecordQuery) {
  return http.request<CommonResult<CommissionSummary[]>>(
    "get",
    baseUrlApi(`${prefix}records/summary/salesperson`),
    { params }
  );
}

export function exportCommissionRecordsApi(params?: CommissionRecordQuery) {
  return http.request<Blob>("get", baseUrlApi(`${prefix}records/export`), {
    params,
    responseType: "blob"
  });
}

export function getCommissionSettlementsApi(index: number) {
  return http.request<CommonResult<CommissionPage<CommissionSettlement>>>(
    "get",
    baseUrlApi(`${prefix}settlements/page/${index}`)
  );
}

export function createCommissionSettlementApi(
  data: CreateCommissionSettlementInput
) {
  return http.request<CommonResult<CommissionSettlement>>(
    "post",
    baseUrlApi(`${prefix}settlements`),
    { data }
  );
}

export function submitCommissionSettlementApi(uid: string) {
  return http.request<CommonResult<CommissionSettlement>>(
    "post",
    baseUrlApi(`${prefix}settlements/${uid}/submit`)
  );
}

export function approveCommissionSettlementApi(uid: string) {
  return http.request<CommonResult<CommissionSettlement>>(
    "post",
    baseUrlApi(`${prefix}settlements/${uid}/approve`)
  );
}

export function reverseCommissionSettlementApi(uid: string, reason: string) {
  return http.request<CommonResult<CommissionSettlement>>(
    "post",
    baseUrlApi(`${prefix}settlements/${uid}/reverse`),
    { data: { reason } }
  );
}

/** COM-C2: PENDING_APPROVAL → DRAFT */
export function rejectCommissionSettlementApi(uid: string, reason: string) {
  return http.request<CommonResult<CommissionSettlement>>(
    "post",
    baseUrlApi(`${prefix}settlements/${uid}/reject`),
    { data: { reason } }
  );
}

/** COM-C1: merge APPROVED PAYROLL settlement into draft payroll run */
export function mergeCommissionIntoPayrollApi(
  uid: string,
  payrollRunId: string
) {
  return http.request<CommonResult<unknown>>(
    "post",
    baseUrlApi(`${prefix}settlements/${uid}/merge-payroll`),
    { data: { payrollRunId } }
  );
}

/** COM-C1/S2: IMMEDIATE payout via fund account */
export function payCommissionImmediateApi(uid: string, paymentId: string) {
  return http.request<CommonResult<unknown>>(
    "post",
    baseUrlApi(`${prefix}settlements/${uid}/pay-immediate`),
    { data: { paymentId } }
  );
}
