import { http } from "@/utils/http";
import { baseUrlApi } from "../utils";
import type { CommonResult, PaginatedResponseDto } from "../type";

/** Runtime approval flow (ApprovalFlow) — AWF-005 */
export type ApprovalStrategy = "ALL" | "ANY";

export interface ApprovalFlowStep {
  approverIds?: string[];
  roleIds?: string[];
  /** UI-only stable key */
  _uid?: string;
}

export interface ApprovalFlowForm {
  uid?: string;
  name: string;
  targetType: string;
  minAmount?: string;
  maxAmount?: string;
  strategy?: ApprovalStrategy;
  steps: ApprovalFlowStep[];
  isEnabled?: boolean;
}

export interface ApprovalFlowVO {
  uid: string;
  id?: number;
  name: string;
  targetType: string;
  minAmount?: string | number | null;
  maxAmount?: string | number | null;
  strategy?: ApprovalStrategy | string | null;
  steps: ApprovalFlowStep[];
  isEnabled?: boolean;
  createdAt?: string;
  companyId?: string;
}

/** @deprecated legacy SystemWorkflow — read-only if still called */
export type WorkflowForm = ApprovalFlowForm;
export type WorkflowVO = ApprovalFlowVO;
export type WorkflowStep = ApprovalFlowStep;
export type WorkflowQuery = {
  page?: number;
  pageSize?: number;
  name?: string;
};

const prefix = "/approval-flow/";

export async function getWorkflowListApi(params?: WorkflowQuery) {
  const page = params?.page ?? 1;
  return await http.request<CommonResult<PaginatedResponseDto<ApprovalFlowVO>>>(
    "get",
    baseUrlApi(`${prefix}page/${page}`)
  );
}

export async function getWorkflowApi(uid: string) {
  return await http.request<CommonResult<ApprovalFlowVO>>(
    "get",
    baseUrlApi(prefix + uid)
  );
}

export async function createWorkflowApi(data: ApprovalFlowForm) {
  return await http.request<CommonResult<ApprovalFlowVO>>(
    "post",
    baseUrlApi(prefix),
    {
      data: {
        name: data.name,
        targetType: data.targetType,
        minAmount: data.minAmount || undefined,
        maxAmount: data.maxAmount || undefined,
        strategy: data.strategy,
        steps: data.steps.map(({ approverIds, roleIds }) => ({
          approverIds: approverIds?.filter(Boolean),
          roleIds: roleIds?.filter(Boolean)
        })),
        isEnabled: data.isEnabled ?? true
      }
    }
  );
}

export async function updateWorkflowApi(uid: string, data: ApprovalFlowForm) {
  return await http.request<CommonResult<ApprovalFlowVO>>(
    "patch",
    baseUrlApi(prefix + uid),
    {
      data: {
        name: data.name,
        minAmount: data.minAmount || undefined,
        maxAmount: data.maxAmount || undefined,
        strategy: data.strategy,
        steps: data.steps.map(({ approverIds, roleIds }) => ({
          approverIds: approverIds?.filter(Boolean),
          roleIds: roleIds?.filter(Boolean)
        })),
        isEnabled: data.isEnabled
      }
    }
  );
}

export async function deleteWorkflowApi(uid: string) {
  return await http.request<CommonResult<void>>(
    "delete",
    baseUrlApi(prefix + uid)
  );
}

/** Legacy restore is not supported for ApprovalFlow soft-delete. */
export async function restoreWorkflowApi(_uid: string) {
  throw new Error("真实审批流不支持从本页恢复 SystemWorkflow；请使用 approval-flow 重新创建");
}
