import { http } from "@/utils/http";
import { baseUrlApi } from "../utils";
import type { CommonResult, PaginatedResponseDto } from "../type";

// ================== 收款单 API ==================
export interface Receipt {
  id: number;
  uid: string;
  billNo: string;
  customerId: string;
  customerName?: string;
  paymentId: string;
  paymentName?: string;
  amount: number;
  writeOffAmount?: number;
  advanceAmount?: number;
  paymentMethod?: string;
  status: string;
  receiptDate?: string;
  remark?: string;
  createdAt?: string;
}

export interface CreateReceiptDto {
  customerId: string;
  paymentId: string;
  amount: number;
  paymentMethod?: string;
  receiptDate?: string;
  remark?: string;
}

export async function getReceiptListApi(
  index: number,
  params?: Record<string, unknown>
) {
  return await http.request<CommonResult<PaginatedResponseDto<Receipt>>>(
    "get",
    baseUrlApi(`/advance-receipt/${index}`),
    { params }
  );
}

export async function createReceiptApi(data: CreateReceiptDto) {
  return await http.request<CommonResult<Receipt>>(
    "post",
    baseUrlApi("/advance-receipt"),
    { data }
  );
}

export async function updateReceiptApi(
  uid: string,
  data: Partial<CreateReceiptDto>
) {
  return await http.request<CommonResult<Receipt>>(
    "put",
    baseUrlApi(`/advance-receipt/${uid}`),
    { data }
  );
}

export async function deleteReceiptApi(uid: string) {
  return await http.request<CommonResult<void>>(
    "delete",
    baseUrlApi(`/advance-receipt/${uid}`)
  );
}

export async function approveReceiptApi(uid: string) {
  return await http.request<CommonResult<void>>(
    "post",
    baseUrlApi(`/advance-receipt/${uid}/approve`)
  );
}
