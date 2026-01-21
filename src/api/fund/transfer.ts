import { http } from "@/utils/http";
import { baseUrlApi } from "../utils";
import type { CommonResult, PaginatedResponseDto } from "../type";

// ================== 转账单 API ==================
export interface Transfer {
  id: number;
  uid: string;
  billNo: string;
  fromPaymentId: string;
  fromPaymentName?: string;
  toPaymentId: string;
  toPaymentName?: string;
  amount: number;
  fee?: number;
  feePaymentId?: string;
  feePaymentName?: string;
  status: string;
  transferDate?: string;
  remark?: string;
  createdAt?: string;
}

export interface CreateTransferDto {
  fromPaymentId: string;
  toPaymentId: string;
  amount: number;
  fee?: number;
  feePaymentId?: string;
  transferDate?: string;
  remark?: string;
}

export async function getTransferListApi(
  index: number,
  params?: Record<string, unknown>
) {
  return await http.request<CommonResult<PaginatedResponseDto<Transfer>>>(
    "get",
    baseUrlApi(`/finance-extension/account-transfer/${index}`),
    { params }
  );
}

export async function createTransferApi(data: CreateTransferDto) {
  return await http.request<CommonResult<Transfer>>(
    "post",
    baseUrlApi("/finance-extension/account-transfer"),
    {
      data: {
        fromPayment: data.fromPaymentId,
        toPayment: data.toPaymentId,
        amount: data.amount,
        ...(data.fee !== undefined ? { fee: data.fee } : {}),
        ...(data.feePaymentId !== undefined
          ? { feePayment: data.feePaymentId }
          : {}),
        ...(data.remark !== undefined ? { remark: data.remark } : {})
      }
    }
  );
}

export async function deleteTransferApi(uid: string) {
  return await http.request<CommonResult<void>>(
    "delete",
    baseUrlApi(`/finance-extension/account-transfer/${uid}`)
  );
}
