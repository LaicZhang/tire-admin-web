import { http } from "@/utils/http";
import { baseUrlApi } from "../utils";
import type { CommonResult, PaginatedResponseDto } from "../type";

// ================== 付款单 API ==================
export interface PaymentOrder {
  id: number;
  uid: string;
  billNo: string;
  providerId: string;
  providerName?: string;
  paymentId: string;
  paymentName?: string;
  amount: number;
  writeOffAmount?: number;
  advanceAmount?: number;
  paymentMethod?: string;
  status: string;
  paymentDate?: string;
  remark?: string;
  createdAt?: string;
}

export interface CreatePaymentOrderDto {
  providerId: string;
  paymentId: string;
  amount: number;
  paymentMethod?: string;
  paymentDate?: string;
  remark?: string;
}

export async function getPaymentOrderListApi(
  index: number,
  params?: Record<string, unknown>
) {
  return await http.request<CommonResult<PaginatedResponseDto<PaymentOrder>>>(
    "get",
    baseUrlApi(`/payment-order/${index}`),
    { params }
  );
}

export async function createPaymentOrderApi(data: CreatePaymentOrderDto) {
  return await http.request<CommonResult<PaymentOrder>>(
    "post",
    baseUrlApi("/payment-order"),
    { data }
  );
}

export async function updatePaymentOrderApi(
  uid: string,
  data: Partial<CreatePaymentOrderDto>
) {
  return await http.request<CommonResult<PaymentOrder>>(
    "put",
    baseUrlApi(`/payment-order/${uid}`),
    { data }
  );
}

export async function deletePaymentOrderApi(uid: string) {
  return await http.request<CommonResult<void>>(
    "delete",
    baseUrlApi(`/payment-order/${uid}`)
  );
}

export async function approvePaymentOrderApi(uid: string) {
  return await http.request<CommonResult<void>>(
    "post",
    baseUrlApi(`/payment-order/${uid}/approve`)
  );
}
