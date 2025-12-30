import { http } from "@/utils/http";
import { baseUrlApi } from "./utils";
import type { CommonResult, PaginatedResponseDto } from "./type";

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

// ================== 核销单 API ==================
export interface WriteOffOrder {
  id: number;
  uid: string;
  billNo: string;
  businessType: string;
  fromCustomerId?: string;
  toCustomerId?: string;
  fromProviderId?: string;
  toProviderId?: string;
  receivableAmount?: number;
  payableAmount?: number;
  writeOffAmount: number;
  status: string;
  isApproved?: boolean;
  writeOffDate?: string;
  reason?: string;
  remark?: string;
  createdAt?: string;
}

export interface CreateWriteOffDto {
  businessType: string;
  fromCustomerId?: string;
  toCustomerId?: string;
  fromProviderId?: string;
  toProviderId?: string;
  receivableAmount?: number;
  payableAmount?: number;
  writeOffAmount: number;
  writeOffDate?: string;
  reason?: string;
  remark?: string;
}

export async function getWriteOffListApi(
  index: number,
  params?: Record<string, unknown>
) {
  return await http.request<CommonResult<PaginatedResponseDto<WriteOffOrder>>>(
    "get",
    baseUrlApi(`/write-off-order/${index}`),
    { params }
  );
}

export async function createWriteOffApi(data: CreateWriteOffDto) {
  return await http.request<CommonResult<WriteOffOrder>>(
    "post",
    baseUrlApi("/write-off-order"),
    { data }
  );
}

export async function approveWriteOffApi(uid: string) {
  return await http.request<CommonResult<void>>(
    "post",
    baseUrlApi(`/write-off-order/${uid}/approve`)
  );
}

export async function rejectWriteOffApi(uid: string) {
  return await http.request<CommonResult<void>>(
    "post",
    baseUrlApi(`/write-off-order/${uid}/reject`)
  );
}

export async function deleteWriteOffApi(uid: string) {
  return await http.request<CommonResult<void>>(
    "delete",
    baseUrlApi(`/write-off-order/${uid}`)
  );
}

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
    baseUrlApi(`/finance-extension/other-transaction/${index}`),
    { params: { ...params, direction: "IN" } }
  );
}

export async function createOtherIncomeApi(data: CreateOtherIncomeDto) {
  return await http.request<CommonResult<OtherIncome>>(
    "post",
    baseUrlApi("/finance-extension/other-transaction"),
    { data: { ...data, direction: "IN" } }
  );
}

export async function deleteOtherIncomeApi(id: number) {
  return await http.request<CommonResult<void>>(
    "delete",
    baseUrlApi(`/finance-extension/other-transaction/${id}`)
  );
}

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
