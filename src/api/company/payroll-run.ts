import { http } from "../../utils/http";
import { baseUrlApi } from "../utils";
import type { CommonResult } from "../type";

const prefix = "/payroll-run";

export type PayrollRunStatus =
  | "DRAFT"
  | "CONFIRMED"
  | "ACCRUED"
  | "PAID"
  | "REVERSED";

export interface PayrollLineItem {
  uid: string;
  code: string;
  name: string;
  category: string;
  calcKind: string;
  amount: string | number;
}

export interface PayrollLine {
  uid: string;
  employeeId: string;
  payableWages: string | number;
  actualWages: string | number;
  employerCost: string | number;
  employee?: { uid?: string; name?: string | null; nickname?: string | null };
  items: PayrollLineItem[];
}

export interface PayrollRun {
  uid: string;
  period: number;
  status: PayrollRunStatus;
  totalPayable: string | number;
  totalActual: string | number;
  totalEmployer: string | number;
  confirmedAt?: string | null;
  accruedAt?: string | null;
  paidAt?: string | null;
  lines?: PayrollLine[];
  vouchers?: Array<{ uid: string; type: string; amount: string | number }>;
  _count?: { lines: number };
}

export function listPayrollRunsApi(params?: {
  period?: number;
  status?: PayrollRunStatus;
}) {
  return http.request<CommonResult<PayrollRun[]>>("get", baseUrlApi(prefix), {
    params
  });
}

export function getPayrollRunApi(uid: string) {
  return http.request<CommonResult<PayrollRun>>(
    "get",
    baseUrlApi(`${prefix}/${uid}`)
  );
}

export function generatePayrollRunApi(data: {
  period: number;
  copyFromPrevious?: boolean;
  copyFromRunUid?: string;
}) {
  return http.request<CommonResult<PayrollRun>>(
    "post",
    baseUrlApi(`${prefix}/generate`),
    { data }
  );
}

export function updatePayrollLineInputsApi(
  runUid: string,
  lineUid: string,
  inputs: Record<string, number | string>
) {
  return http.request<CommonResult<PayrollRun>>(
    "patch",
    baseUrlApi(`${prefix}/${runUid}/lines/${lineUid}/inputs`),
    { data: { inputs } }
  );
}

export function recalculatePayrollRunApi(uid: string) {
  return http.request<CommonResult<PayrollRun>>(
    "post",
    baseUrlApi(`${prefix}/${uid}/recalculate`)
  );
}

export function confirmPayrollRunApi(uid: string) {
  return http.request<CommonResult<PayrollRun>>(
    "post",
    baseUrlApi(`${prefix}/${uid}/confirm`)
  );
}

export function unconfirmPayrollRunApi(uid: string) {
  return http.request<CommonResult<PayrollRun>>(
    "post",
    baseUrlApi(`${prefix}/${uid}/unconfirm`)
  );
}

export function accruePayrollRunApi(uid: string, reason?: string) {
  return http.request<CommonResult<PayrollRun>>(
    "post",
    baseUrlApi(`${prefix}/${uid}/accrue`),
    { data: { reason } }
  );
}

export function disbursePayrollRunApi(
  uid: string,
  data: { paymentId: string; amount: number; reason?: string }
) {
  return http.request<CommonResult<PayrollRun>>(
    "post",
    baseUrlApi(`${prefix}/${uid}/disburse`),
    { data }
  );
}

export function reversePayrollRunApi(uid: string, reason: string) {
  return http.request<CommonResult<PayrollRun>>(
    "post",
    baseUrlApi(`${prefix}/${uid}/reverse`),
    { data: { reason } }
  );
}
