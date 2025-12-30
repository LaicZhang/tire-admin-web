import { http } from "@/utils/http";
import { baseUrlApi } from "../utils";
import type { CommonResult } from "../type";

const prefix = "/finance/advance-payment";

export interface AdvancePaymentDto {
  type: "RECEIPT" | "PAYMENT";
  targetId: string;
  /** 金额（分） */
  amount: number;
  /** 后端暂未落库，兼容字段 */
  paymentMethod?: string;
  remark?: string;
}

export interface AdvancePaymentListItem {
  id: number;
  billNo: string;
  type: "RECEIPT" | "PAYMENT";
  targetName: string;
  /** 金额（分），后端返回为字符串（bigint 序列化） */
  amount: string;
  /** 剩余金额（分），后端返回为字符串（bigint 序列化） */
  remainingAmount: string;
  paymentMethod: string;
  remark?: string;
  createTime: string;
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
export function deleteAdvancePayment(id: string) {
  return http.request<CommonResult<void>>(
    "delete",
    baseUrlApi(`${prefix}/${id}`)
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
