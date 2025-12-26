import { http } from "@/utils/http";
import { baseUrlApi } from "../utils";
import type { CommonResult } from "../type";

const prefix = "/write-off-order";

/** 核销类型 */
export type WriteOffType = "OFFSET" | "BAD_DEBT";

/** 核销单 DTO */
export interface WriteOffOrderDto {
  type: WriteOffType;
  customerId?: string;
  providerId?: string;
  receivableAmount: number;
  payableAmount: number;
  writeOffAmount: number;
  reason?: string;
  remark?: string;
  relatedOrderIds?: string;
}

/** 核销单 */
export interface WriteOffOrder extends WriteOffOrderDto {
  id: number;
  uid: string;
  isApproved: boolean;
  operatorId: string;
  auditorId?: string;
  createAt: string;
  auditAt?: string;
  customer?: { name: string };
  provider?: { name: string };
  operator?: { name: string };
  auditor?: { name: string };
}

/** 获取核销单列表 */
export function getWriteOffList(params?: {
  index?: number;
  type?: string;
  customerId?: string;
  providerId?: string;
  isApproved?: string;
}) {
  return http.request<CommonResult<{ count: number; list: WriteOffOrder[] }>>(
    "get",
    baseUrlApi(prefix),
    { params }
  );
}

/** 获取核销单详情 */
export function getWriteOffDetail(uid: string) {
  return http.request<CommonResult<WriteOffOrder>>(
    "get",
    baseUrlApi(`${prefix}/${uid}`)
  );
}

/** 创建核销单 */
export function createWriteOff(data: WriteOffOrderDto) {
  return http.request<CommonResult<WriteOffOrder>>("post", baseUrlApi(prefix), {
    data
  });
}

/** 更新核销单 */
export function updateWriteOff(uid: string, data: Partial<WriteOffOrderDto>) {
  return http.request<CommonResult<WriteOffOrder>>(
    "patch",
    baseUrlApi(`${prefix}/${uid}`),
    { data }
  );
}

/** 审核核销单 */
export function approveWriteOff(uid: string) {
  return http.request<CommonResult<WriteOffOrder>>(
    "post",
    baseUrlApi(`${prefix}/${uid}/approve`)
  );
}

/** 拒绝核销单 */
export function rejectWriteOff(uid: string) {
  return http.request<CommonResult<{ success: boolean }>>(
    "post",
    baseUrlApi(`${prefix}/${uid}/reject`)
  );
}

/** 删除核销单 */
export function deleteWriteOff(uid: string) {
  return http.request<CommonResult<{ success: boolean }>>(
    "delete",
    baseUrlApi(`${prefix}/${uid}`)
  );
}
