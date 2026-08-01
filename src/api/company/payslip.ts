import { http } from "../../utils/http";
import { baseUrlApi } from "../utils";
import type { CommonResult } from "../type";

const prefix = "/payslip";

export interface PayslipDispatchReport {
  successInApp: number;
  successEmail: number;
  skippedNoEmail: number;
  failedEmail: number;
  failedInApp: number;
}

export function dispatchPayslipsApi(runUid: string, batchKey?: string) {
  return http.request<CommonResult<PayslipDispatchReport>>(
    "post",
    baseUrlApi(`${prefix}/run/${runUid}/dispatch`),
    { data: { batchKey } }
  );
}

export function listPayslipDispatchesApi(runUid: string) {
  return http.request<CommonResult<unknown[]>>(
    "get",
    baseUrlApi(`${prefix}/run/${runUid}/dispatches`)
  );
}
