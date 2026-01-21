import { http } from "@/utils/http";
import { baseUrlApi } from "../utils";
import type { CommonResult, PaginatedResponseDto } from "../type";

// ================== 资金报表 API ==================
export interface FundFlow {
  id: number;
  uid: string;
  serialNo: string;
  billNo?: string;
  billType?: string;
  paymentId: string;
  paymentName?: string;
  transactionType: string;
  direction: "IN" | "OUT";
  amount: number;
  beforeBalance?: number;
  afterBalance?: number;
  targetName?: string;
  summary?: string;
  transactionTime?: string;
  operatorName?: string;
  createdAt?: string;
}

export interface AccountBalance {
  paymentId: string;
  paymentName: string;
  accountType?: string;
  openingBalance: number;
  periodIncome: number;
  periodExpense: number;
  closingBalance: number;
}

export interface ContactDebt {
  targetId: string;
  targetName: string;
  targetType: "CUSTOMER" | "PROVIDER";
  receivableAmount: number;
  payableAmount: number;
  netDebt: number;
  advanceReceived?: number;
  advancePaid?: number;
}

export async function getFundFlowListApi(
  index: number,
  params?: Record<string, unknown>
) {
  return await http.request<CommonResult<PaginatedResponseDto<FundFlow>>>(
    "get",
    baseUrlApi(`/statement/${index}`),
    { params }
  );
}

export async function getAccountBalanceApi(params?: Record<string, unknown>) {
  return await http.request<CommonResult<AccountBalance[]>>(
    "get",
    baseUrlApi("/statement/account-balance"),
    { params }
  );
}

export async function getContactDebtListApi(
  index: number,
  params?: Record<string, unknown>
) {
  return await http.request<CommonResult<PaginatedResponseDto<ContactDebt>>>(
    "get",
    baseUrlApi(`/statement/contact-debt/${index}`),
    { params }
  );
}
