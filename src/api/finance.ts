import { http } from "../utils/http";
import { baseUrlApi } from "./utils";
import type { CommonResult, PaginatedResponseDto } from "./type";

const prefix = "/finance-extension/";

export interface OtherTransaction {
  id: number;
  type: "income" | "expense";
  categoryId?: number;
  categoryName?: string;
  amount: number;
  paymentUid: string;
  paymentName?: string;
  date?: string;
  desc?: string;
  createTime?: string;
}

export interface CollectionReminder {
  id: number;
  customerUid: string;
  customerName?: string;
  amount: number;
  dueDate: string;
  content?: string;
  status: string;
  createTime?: string;
}

export interface IncomeExpenseItem {
  id: number;
  name: string;
  type: "income" | "expense";
  desc?: string;
}

/** 录入期初余额 */
export async function setInitialBalanceApi(data: {
  paymentUid: string;
  amount: number;
  date?: string;
  desc?: string;
}) {
  return await http.request<CommonResult<void>>(
    "post",
    baseUrlApi(prefix + "initial-balance"),
    { data }
  );
}

/** 账户互转 */
export async function accountTransferApi(data: {
  fromPaymentUid: string;
  toPaymentUid: string;
  amount: number;
  fee?: number;
  feePaymentUid?: string;
  desc?: string;
}) {
  return await http.request<CommonResult<void>>(
    "post",
    baseUrlApi(prefix + "account-transfer"),
    {
      data: {
        fromPayment: data.fromPaymentUid,
        toPayment: data.toPaymentUid,
        amount: data.amount,
        ...(data.fee !== undefined ? { fee: data.fee } : {}),
        ...(data.feePaymentUid !== undefined
          ? { feePayment: data.feePaymentUid }
          : {}),
        ...(data.desc !== undefined ? { remark: data.desc } : {})
      }
    }
  );
}

/** 创建其他收支记录 */
export async function createOtherTransactionApi(data: {
  type: "income" | "expense";
  categoryId?: number;
  amount: number;
  paymentUid: string;
  date?: string;
  desc?: string;
}) {
  return await http.request<CommonResult<OtherTransaction>>(
    "post",
    baseUrlApi(prefix + "other-transaction"),
    { data }
  );
}

/** 获取其他收支列表 */
export async function getOtherTransactionListApi(
  index: number,
  params?: { type?: string; startDate?: string; endDate?: string }
) {
  return await http.request<
    CommonResult<PaginatedResponseDto<OtherTransaction>>
  >("get", baseUrlApi(prefix + `other-transaction/${index}`), { params });
}

/** 创建催收提醒 */
export async function createCollectionReminderApi(data: {
  customerUid: string;
  amount: number;
  dueDate: string;
  content?: string;
}) {
  return await http.request<CommonResult<CollectionReminder>>(
    "post",
    baseUrlApi(prefix + "collection-reminder"),
    { data }
  );
}

/** 获取催收提醒列表 */
export async function getCollectionReminderListApi(
  index: number,
  params?: { status?: string }
) {
  return await http.request<
    CommonResult<PaginatedResponseDto<CollectionReminder>>
  >("get", baseUrlApi(prefix + `collection-reminder/${index}`), { params });
}

/** 获取收支项目列表 */
export async function getIncomeExpenseItemListApi(
  index: number,
  params?: { type?: "income" | "expense" }
) {
  return await http.request<
    CommonResult<PaginatedResponseDto<IncomeExpenseItem>>
  >("get", baseUrlApi(prefix + `item/${index}`), { params });
}

/** 创建收支项目 */
export async function createIncomeExpenseItemApi(data: {
  name: string;
  type: "income" | "expense";
  desc?: string;
}) {
  return await http.request<CommonResult<IncomeExpenseItem>>(
    "post",
    baseUrlApi(prefix + "item"),
    { data }
  );
}

/** 删除收支项目 */
export async function deleteIncomeExpenseItemApi(id: number) {
  return await http.request<CommonResult<void>>(
    "delete",
    baseUrlApi(prefix + `item/${id}`)
  );
}
