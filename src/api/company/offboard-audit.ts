import { http } from "@/utils/http";
import { baseUrlApi } from "../utils";
import type { CommonResult } from "../type";

export type OffboardAuditAction =
  | "LAYOFF"
  | "REMOVE"
  | "SUSPEND"
  | "REINSTATE"
  | "COMPANY_CLOSE"
  | "TRANSFER_BOSS";

export type OffboardAuditEvent = {
  id: number;
  uid: string;
  companyId: string;
  action: OffboardAuditAction | string;
  targetEmployeeId?: string | null;
  operatorId: string;
  reason?: string | null;
  handoffUserId?: string | null;
  payload?: Record<string, unknown> | null;
  createAt: string;
};

export type OffboardAuditListResult = {
  list: OffboardAuditEvent[];
  total: number;
  page: number;
  pageSize: number;
};

export async function getOffboardAuditListApi(params?: {
  page?: number;
  pageSize?: number;
  action?: OffboardAuditAction | string;
}) {
  return await http.request<CommonResult<OffboardAuditListResult>>(
    "get",
    baseUrlApi("/offboard-audit"),
    { params }
  );
}
