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
  customer?: {
    uid: string;
    name: string;
  };
  paymentId: string;
  paymentName?: string;
  payment?: {
    uid: string;
    name: string;
  };
  amount: number;
  actualAmount?: number;
  writeOffAmount?: number;
  advanceAmount?: number;
  paymentMethod?: string;
  status: string;
  receiptDate?: string;
  remark?: string;
  details?: ReceiptDetailItem[];
  operatorId?: string;
  approverId?: string;
  approvedAt?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface ReceiptDetailItem {
  id?: number;
  sourceOrderId?: string;
  sourceOrderNo?: string;
  sourceOrderType?: string;
  receivableAmount: number;
  writeOffAmount: number;
  remark?: string;
}

export interface CreateReceiptDto {
  customerId: string;
  paymentId: string;
  amount: number;
  paymentMethod?: string;
  receiptDate?: string;
  remark?: string;
  details?: Omit<ReceiptDetailItem, "id">[];
}

export async function getReceiptListApi(
  index: number,
  params?: Record<string, unknown>
) {
  return await http.request<CommonResult<PaginatedResponseDto<Receipt>>>(
    "get",
    baseUrlApi(`/receipt-order/${index}`),
    { params }
  );
}

export async function createReceiptApi(data: CreateReceiptDto) {
  return await http.request<CommonResult<Receipt>>(
    "post",
    baseUrlApi("/receipt-order"),
    { data }
  );
}

export async function updateReceiptApi(
  uid: string,
  data: Partial<CreateReceiptDto>
) {
  return await http.request<CommonResult<Receipt>>(
    "put",
    baseUrlApi(`/receipt-order/${uid}`),
    { data }
  );
}

export async function deleteReceiptApi(uid: string) {
  return await http.request<CommonResult<void>>(
    "delete",
    baseUrlApi(`/receipt-order/${uid}`)
  );
}

export async function approveReceiptApi(uid: string) {
  return await http.request<CommonResult<void>>(
    "post",
    baseUrlApi(`/receipt-order/${uid}/approve`)
  );
}
