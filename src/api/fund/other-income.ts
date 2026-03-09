import { http } from "@/utils/http";
import { baseUrlApi } from "../utils";
import type { CommonResult, PaginatedResponseDto } from "../type";

// ================== 其他收入单 API ==================
export interface OtherIncome {
  id: number;
  uid: string;
  billNo: string;
  customerId?: string;
  customerName?: string;
  incomeType: string;
  amount: number;
  receivedAmount?: number;
  unpaidAmount?: number;
  paymentId?: string;
  paymentName?: string;
  incomeDate?: string;
  status: string;
  category?: string;
  remark?: string;
  createdAt?: string;
}

export interface CreateOtherIncomeDto {
  customerId?: string;
  incomeType: string;
  amount: number;
  receivedAmount?: number;
  paymentId?: string;
  incomeDate?: string;
  category?: string;
  remark?: string;
}

export async function getOtherIncomeListApi(
  index: number,
  params?: Record<string, unknown>
) {
  return await http.request<CommonResult<PaginatedResponseDto<OtherIncome>>>(
    "get",
    baseUrlApi(`/other-income-order/${index}`),
    { params }
  );
}

export async function createOtherIncomeApi(data: CreateOtherIncomeDto) {
  return await http.request<CommonResult<OtherIncome>>(
    "post",
    baseUrlApi("/other-income-order"),
    { data }
  );
}

export async function deleteOtherIncomeApi(uid: string) {
  return await http.request<CommonResult<void>>(
    "delete",
    baseUrlApi(`/other-income-order/${uid}`)
  );
}
