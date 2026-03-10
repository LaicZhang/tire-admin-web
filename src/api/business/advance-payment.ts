import { http } from "@/utils/http";
import { baseUrlApi } from "../utils";
import type { CommonResult } from "../type";

const prefix = "/finance/advance-payment";

export type AdvancePaymentType = "RECEIPT" | "PAYMENT";

export interface AdvancePaymentDto {
  type: AdvancePaymentType;
  targetId: string;
  /** 金额（分） */
  amount: number;
  paymentId?: string;
  paymentMethod?: string;
  paymentDate?: string;
  remark?: string;
}

export interface AdvancePaymentListItem {
  id: number;
  uid?: string;
  billNo: string;
  type: AdvancePaymentType;
  targetName: string;
  /** 金额（分），后端返回为字符串（bigint 序列化） */
  amount: string;
  /** 剩余金额（分），后端返回为字符串（bigint 序列化） */
  remainingAmount: string;
  paymentMethod: string;
  remark?: string;
  createTime: string;
  status?: string;
}

export interface AdvancePaymentListResponse {
  list: AdvancePaymentListItem[];
  total: number;
  /** 兼容部分接口返回字段 */
  count?: number;
}

/** 获取预收/预付款列表 */
export function getAdvancePaymentList(params?: {
  page?: number;
  pageSize?: number;
  type?: string;
  targetName?: string;
}) {
  return http.request<CommonResult<AdvancePaymentListResponse>>(
    "get",
    baseUrlApi(prefix),
    { params }
  );
}

/** 创建预收/预付款 */
export function createAdvancePayment(data: AdvancePaymentDto) {
  return http.request<CommonResult<unknown>>("post", baseUrlApi(prefix), {
    data
  });
}

/** 删除预收/预付款 */
export function deleteAdvancePayment(id: string, type?: AdvancePaymentType) {
  return http.request<CommonResult<void>>(
    "delete",
    baseUrlApi(`${prefix}/${id}`),
    {
      params: type ? { type } : undefined
    }
  );
}

/** 审核预付款 */
export function approveAdvancePayment(id: string, type?: AdvancePaymentType) {
  return http.request<CommonResult<void>>(
    "post",
    baseUrlApi(`${prefix}/${id}/approve`),
    {
      params: type ? { type } : undefined
    }
  );
}

/** 核销预收/预付款 */
export function writeOffAdvancePayment(data: {
  advanceId: number;
  orderUid: string;
  amount: number;
}) {
  return http.request<CommonResult<void>>(
    "post",
    baseUrlApi(`${prefix}/write-off`),
    {
      data
    }
  );
}
