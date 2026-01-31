import { http } from "@/utils/http";
import { baseUrlApi } from "../utils";
import type { CommonResult, PaginatedResponseDto } from "../type";

/** 操作日志查询参数 */
export interface OperationLogQuery {
  page?: number;
  pageSize?: number;
  username?: string;
  operationType?: string;
  moduleName?: string;
  startTime?: string;
  endTime?: string;
}

/** 操作日志记录 */
export interface OperationLog {
  uid: string;
  userId: string;
  username: string;
  operationType: string;
  operationTypeName: string;
  moduleName: string;
  targetId?: string;
  targetName?: string;
  detail: string;
  ip: string;
  userAgent: string;
  createTime: string;
}

export async function getOperationLogsApi(params?: OperationLogQuery) {
  return await http.request<CommonResult<PaginatedResponseDto<OperationLog>>>(
    "get",
    baseUrlApi("/operation-log/"),
    {
      params
    }
  );
}
