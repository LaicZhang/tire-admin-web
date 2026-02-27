import { http } from "@/utils/http";
import { baseUrlApi } from "../utils";
import type { CommonResult, PaginatedResponseDto } from "../type";

const prefix = "/system/log/";

export interface OperationLogItem {
  id: number;
  module: string;
  method: string;
  operator: string;
  operatorId?: string;
  ip?: string;
  path?: string;
  traceId?: string;
  params?: string;
  result?: string;
  success: boolean;
  errorMsg?: string;
  error?: string;
  createTime: string;
  createdAt?: string;
  duration?: number;
}

/** 获取操作日志列表 */
export async function getOperationLogListApi(
  index: number,
  params?: {
    module?: string;
    method?: string;
    operator?: string;
    traceId?: string;
    startDate?: string;
    endDate?: string;
    success?: boolean;
  }
) {
  return await http.request<
    CommonResult<PaginatedResponseDto<OperationLogItem>>
  >("get", baseUrlApi(prefix + `list/${index}`), { params });
}
