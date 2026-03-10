import { http } from "@/utils/http";
import { baseUrlApi } from "../utils";
import type { CommonResult, PaginatedResponseDto } from "../type";

const prefix = "/finance/statement";

export interface StatementDto {
  type: string;
  targetId: string;
  startDate: string;
  endDate: string;
  openingBalance?: number;
}

export interface Statement extends StatementDto {
  id: number;
  uid: string;
  statementNo?: string;
  status?: string;
  targetName?: string;
  amount?: string;
  createTime?: string;
  startTime?: string;
  endTime?: string;
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
  const payload =
    data.type === "CUSTOMER"
      ? {
          type: "receivable",
          customerId: data.targetId,
          startDate: data.startDate,
          endDate: data.endDate,
          openingBalance: data.openingBalance
        }
      : {
          type: "payable",
          providerId: data.targetId,
          startDate: data.startDate,
          endDate: data.endDate,
          openingBalance: data.openingBalance
        };

  return http.request<CommonResult<Statement>>(
    "post",
    baseUrlApi("/statement/generate"),
    {
      data: payload
    }
  );
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
