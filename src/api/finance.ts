import { http } from "../utils/http";
import { baseUrlApi } from "./utils";
import type { CommonResult } from "./type";

const prefix = "/finance-extension/";

/** 录入期初余额 */
export async function setInitialBalanceApi(data: {
  paymentUid: string;
  amount: number;
  date?: string;
  desc?: string;
}) {
  return await http.request<CommonResult>(
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
  desc?: string;
}) {
  return await http.request<CommonResult>(
    "post",
    baseUrlApi(prefix + "account-transfer"),
    { data }
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
  return await http.request<CommonResult>(
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
  return await http.request<CommonResult>(
    "get",
    baseUrlApi(prefix + `other-transaction/${index}`),
    { params }
  );
}

/** 创建催收提醒 */
export async function createCollectionReminderApi(data: {
  customerUid: string;
  amount: number;
  dueDate: string;
  content?: string;
}) {
  return await http.request<CommonResult>(
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
  return await http.request<CommonResult>(
    "get",
    baseUrlApi(prefix + `collection-reminder/${index}`),
    { params }
  );
}

/** 获取收支项目列表 */
export async function getIncomeExpenseItemListApi(
  index: number,
  params?: { type?: "income" | "expense" }
) {
  return await http.request<CommonResult>(
    "get",
    baseUrlApi(prefix + `item/${index}`),
    { params }
  );
}

/** 创建收支项目 */
export async function createIncomeExpenseItemApi(data: {
  name: string;
  type: "income" | "expense";
  desc?: string;
}) {
  return await http.request<CommonResult>("post", baseUrlApi(prefix + "item"), {
    data
  });
}

/** 删除收支项目 */
export async function deleteIncomeExpenseItemApi(id: number) {
  return await http.request<CommonResult>(
    "delete",
    baseUrlApi(prefix + `item/${id}`)
  );
}
