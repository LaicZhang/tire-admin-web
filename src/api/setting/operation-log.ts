import { http } from "@/utils/http";
import { baseUrlApi } from "../utils";
import type { CommonResult, PaginatedResponseDto } from "../type";

/** 操作日志查询参数 */
export interface OperationLogQuery {
  page?: number;
  pageSize?: number;
  keyword?: string;
  userId?: string;
  module?: string;
  action?: string;
  startDate?: string;
  endDate?: string;
}

/** 操作日志记录 */
export interface OperationLog {
  uid: string;
  id: number;
  userId: string;
  username: string;
  module: string;
  action: string;
  content: string;
  ip: string;
  createdAt: string;
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
