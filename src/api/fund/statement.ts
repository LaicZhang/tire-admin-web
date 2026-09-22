import type { CommonResult, PaginatedResponseDto } from "../type";
import { unsupportedBackendRoute } from "../route-gap";

/**
 * T3-X-002：这三条读路径没有后端路由。
 * 不要改接到 receivable-statement / payable-statement（那是另一套对账单）。
 */

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

/** 资金流水查询参数 */
export interface FundFlowQueryDto {
  startDate?: string;
  endDate?: string;
  paymentId?: string;
  direction?: "IN" | "OUT";
  billType?: string;
  keyword?: string;
}

/** 账户余额查询参数 */
export interface AccountBalanceQueryDto {
  startDate?: string;
  endDate?: string;
  paymentId?: string;
}

/** 往来账款查询参数 */
export interface ContactDebtQueryDto {
  startDate?: string;
  endDate?: string;
  targetType?: "CUSTOMER" | "PROVIDER";
  keyword?: string;
}

export async function getFundFlowListApi(
  _index: number,
  _params?: FundFlowQueryDto
): Promise<CommonResult<PaginatedResponseDto<FundFlow>>> {
  return unsupportedBackendRoute("GET /statement/:index");
}

export async function getAccountBalanceApi(
  _params?: AccountBalanceQueryDto
): Promise<CommonResult<AccountBalance[]>> {
  return unsupportedBackendRoute("GET /statement/account-balance");
}

export async function getContactDebtListApi(
  _index: number,
  _params?: ContactDebtQueryDto
): Promise<CommonResult<PaginatedResponseDto<ContactDebt>>> {
  return unsupportedBackendRoute("GET /statement/contact-debt/:index");
}
