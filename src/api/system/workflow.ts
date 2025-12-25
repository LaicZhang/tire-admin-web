import { http } from "@/utils/http";
import { baseUrlApi } from "../utils";
import type { CommonResult, PaginatedResponseDto } from "../type";

/** Workflow Query Parameters */
export interface WorkflowQuery extends Record<string, unknown> {
  name?: string;
  status?: number;
  pageNum?: number;
  pageSize?: number;
}

/** Workflow Form Data */
export interface WorkflowForm {
  id?: number;
  name: string;
  description?: string;
  steps: WorkflowStep[];
  status: number;
}

/** Workflow Step Definition */
export interface WorkflowStep {
  name: string;
  approverId?: number;
  approverType: "user" | "role";
  condition?: string;
}

/** Workflow View Object */
export interface WorkflowVO {
  id: number;
  name: string;
  description: string;
  steps: WorkflowStep[];
  status: number;
  createTime: string;
}

const prefix = "/system/workflow/";

/** Get Workflow List */
export async function getWorkflowListApi(params?: WorkflowQuery) {
  return await http.request<CommonResult<PaginatedResponseDto<WorkflowVO>>>(
    "get",
    baseUrlApi(prefix + "list"),
    {
      params
    }
  );
}

/** Get Workflow Detail */
export async function getWorkflowApi(id: number) {
  return await http.request<CommonResult<WorkflowVO>>(
    "get",
    baseUrlApi(prefix + id)
  );
}

/** Create Workflow */
export async function createWorkflowApi(data: WorkflowForm) {
  return await http.request<CommonResult<WorkflowVO>>(
    "post",
    baseUrlApi(prefix),
    {
      data
    }
  );
}

/** Update Workflow */
export async function updateWorkflowApi(id: number, data: WorkflowForm) {
  return await http.request<CommonResult<WorkflowVO>>(
    "patch",
    baseUrlApi(prefix + id),
    {
      data
    }
  );
}

/** Delete Workflow */
export async function deleteWorkflowApi(id: number) {
  return await http.request<CommonResult<void>>(
    "delete",
    baseUrlApi(prefix + id)
  );
}
