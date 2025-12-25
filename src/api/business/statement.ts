import { http } from "@/utils/http";
import { baseUrlApi } from "../utils";
import type { CommonResult, PaginatedResponseDto } from "../type";

const prefix = "/finance/statement";

export interface StatementDto {
  type: string;
  targetId: string;
  startTime: string;
  endTime: string;
  title: string;
}

export interface Statement extends StatementDto {
  id: number;
  uid: string;
  status?: string;
  targetName?: string;
}

/** 获取对账单列表 */
export function getStatementList(params?: {
  page?: number;
  pageSize?: number;
  type?: string;
  targetName?: string;
  status?: string;
}) {
  return http.request<CommonResult<PaginatedResponseDto<Statement>>>(
    "get",
    baseUrlApi(prefix),
    { params }
  );
}

/** 获取对账单详情 */
export function getStatementDetail(id: string) {
  return http.request<CommonResult<Statement>>(
    "get",
    baseUrlApi(`${prefix}/${id}`)
  );
}

/** 创建对账单 */
export function createStatement(data: StatementDto) {
  return http.request<CommonResult<Statement>>("post", baseUrlApi(prefix), {
    data
  });
}

/** 确认对账 */
export function confirmStatement(id: string) {
  return http.request<CommonResult<Statement>>(
    "put",
    baseUrlApi(`${prefix}/${id}/confirm`)
  );
}

/** 作废对账单 */
export function voidStatement(id: string) {
  return http.request<CommonResult<Statement>>(
    "put",
    baseUrlApi(`${prefix}/${id}/void`)
  );
}
