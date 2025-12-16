import { http } from "@/utils/http";
import { baseUrlApi } from "../utils";
import type { CommonResult } from "../type";

const prefix = "/finance/advance-payment";

/** 获取预收/预付款列表 */
export function getAdvancePaymentList(params?: {
  page?: number;
  pageSize?: number;
  type?: string; // RECEIPT | PAYMENT
  targetName?: string;
}) {
  return http.request<CommonResult>("get", baseUrlApi(prefix), { params });
}

/** 创建预收/预付款 */
export function createAdvancePayment(data: {
  type: "RECEIPT" | "PAYMENT";
  targetId: string; // Customer ID or Provider ID
  amount: number;
  paymentMethod: string;
  remark?: string;
}) {
  return http.request<CommonResult>("post", baseUrlApi(prefix), { data });
}

/** 删除预收/预付款 */
export function deleteAdvancePayment(id: string) {
  return http.request<CommonResult>("delete", baseUrlApi(`${prefix}/${id}`));
}

/** 核销预收/预付款 */
export function writeOffAdvancePayment(data: {
  id: string;
  orderId: string;
  amount: number;
}) {
  return http.request<CommonResult>("post", baseUrlApi(`${prefix}/write-off`), {
    data
  });
}
