import { http } from "@/utils/http";
import { baseUrlApi } from "../utils";
import type { CommonResult, PaginatedResponseDto } from "../type";

const prefix = "/finance/advance-payment";

export interface AdvancePaymentDto {
  type: "RECEIPT" | "PAYMENT";
  targetId: string;
  amount: number;
  paymentMethod: string;
  remark?: string;
}

export interface AdvancePayment extends AdvancePaymentDto {
  id: number;
  uid: string;
  targetName?: string;
}

/** 获取预收/预付款列表 */
export function getAdvancePaymentList(params?: {
  page?: number;
  pageSize?: number;
  type?: string;
  targetName?: string;
}) {
  return http.request<CommonResult<PaginatedResponseDto<AdvancePayment>>>(
    "get",
    baseUrlApi(prefix),
    { params }
  );
}

/** 创建预收/预付款 */
export function createAdvancePayment(data: AdvancePaymentDto) {
  return http.request<CommonResult<AdvancePayment>>(
    "post",
    baseUrlApi(prefix),
    { data }
  );
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
  id: string;
  orderId: string;
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
