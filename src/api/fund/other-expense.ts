import { http } from "@/utils/http";
import { baseUrlApi } from "../utils";
import type { CommonResult, PaginatedResponseDto } from "../type";

// ================== 其他支出单 API ==================
export interface OtherExpense {
  id: number;
  uid: string;
  billNo: string;
  providerId?: string;
  providerName?: string;
  expenseType: string;
  amount: number;
  paidAmount?: number;
  unpaidAmount?: number;
  paymentId?: string;
  paymentName?: string;
  expenseDate?: string;
  status: string;
  category?: string;
  relatedOrderId?: string;
  relatedOrderNo?: string;
  remark?: string;
  createdAt?: string;
}

export interface CreateOtherExpenseDto {
  providerId?: string;
  expenseType: string;
  amount: number;
  paidAmount?: number;
  paymentId?: string;
  expenseDate?: string;
  category?: string;
  relatedOrderId?: string;
  remark?: string;
}

export async function getOtherExpenseListApi(
  index: number,
  params?: Record<string, unknown>
) {
  return await http.request<CommonResult<PaginatedResponseDto<OtherExpense>>>(
    "get",
    baseUrlApi(`/expense-order/${index}`),
    { params }
  );
}

export async function createOtherExpenseApi(data: CreateOtherExpenseDto) {
  return await http.request<CommonResult<OtherExpense>>(
    "post",
    baseUrlApi("/expense-order"),
    { data }
  );
}

export async function deleteOtherExpenseApi(uid: string) {
  return await http.request<CommonResult<void>>(
    "delete",
    baseUrlApi(`/expense-order/${uid}`)
  );
}
