import { http } from "@/utils/http";
import { baseUrlApi } from "../utils";
import type { CommonResult } from "../type";

export interface AdminRollbackPlanItemDto {
  snapshotUid: string;
  entityType: string;
  entityId: string;
  operationType: string;
  createdAt: string;
  operatorId?: string | null;
  operationLogUid?: string | null;
  rollbackSupported: boolean;
  note?: string;
}

export interface AdminRollbackPlanResponseDto {
  traceId: string;
  canRollback: boolean;
  items: AdminRollbackPlanItemDto[];
}

export interface AdminRollbackTraceResultDto {
  traceId: string;
  success: boolean;
  restoredCount: number;
  skippedCount: number;
  errors: string[];
  reversalLogUid?: string;
}

export interface AdminRollbackResponseDto {
  list: AdminRollbackTraceResultDto[];
}

export interface AdminRollbackByTraceDto {
  traceIds: string[];
  reason: string;
  force?: boolean;
}

export const getAdminRollbackPlanApi = (traceId: string) => {
  return http.request<CommonResult<AdminRollbackPlanResponseDto>>(
    "get",
    baseUrlApi(`/admin/rollback/plan/${encodeURIComponent(traceId)}`)
  );
};

export const postAdminRollbackByTraceApi = (data: AdminRollbackByTraceDto) => {
  return http.request<CommonResult<AdminRollbackResponseDto>>(
    "post",
    baseUrlApi("/admin/rollback/trace"),
    { data }
  );
};
