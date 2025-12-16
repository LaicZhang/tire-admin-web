import { http } from "@/utils/http";
import { baseUrlApi } from "../utils";
import type { CommonResult } from "../type";

const prefix = "/finance/statement";

/** 获取对账单列表 */
export function getStatementList(params?: {
  page?: number;
  pageSize?: number;
  type?: string; // CUSTOMER | PROVIDER
  targetName?: string;
  status?: string;
}) {
  return http.request<CommonResult>("get", baseUrlApi(prefix), { params });
}

/** 获取对账单详情 */
export function getStatementDetail(id: string) {
  return http.request<CommonResult>("get", baseUrlApi(`${prefix}/${id}`));
}

/** 创建对账单 */
export function createStatement(data: {
  type: string;
  targetId: string;
  startTime: string;
  endTime: string;
  title: string;
}) {
  return http.request<CommonResult>("post", baseUrlApi(prefix), { data });
}

/** 确认对账 */
export function confirmStatement(id: string) {
  return http.request<CommonResult>(
    "put",
    baseUrlApi(`${prefix}/${id}/confirm`)
  );
}

/** 作废对账单 */
export function voidStatement(id: string) {
  return http.request<CommonResult>("put", baseUrlApi(`${prefix}/${id}/void`));
}
