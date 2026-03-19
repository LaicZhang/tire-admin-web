import { http } from "../utils/http";
import { baseUrlApi } from "./utils";
import type { CommonResult, PaginatedResponseDto } from "./type";

const prefix = "/finance-extension/";

export interface OtherTransaction {
  id: number;
  uid: string;
  type: "income" | "expense";
  categoryName?: string;
  amount: number;
  paymentUid?: string;
  paymentName?: string;
  date?: string;
  desc?: string;
  createTime?: string;
  createdAt?: string;
  status?: string;
}

type OtherIncomeOrder = {
  id: number;
  uid: string;
  amount: number;
  incomeType: string;
  category?: string;
  paymentId?: string;
  paymentName?: string;
  incomeDate?: string;
  remark?: string;
  createdAt?: string;
  status?: string;
};

type OtherExpenseOrder = {
  id: number;
  uid: string;
  amount: number;
  expenseType: string;
  category?: string;
  paymentId?: string;
  paymentName?: string;
  expenseDate?: string;
  remark?: string;
  createdAt?: string;
  status?: string;
};

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

function mapIncomeOrderToTransaction(item: OtherIncomeOrder): OtherTransaction {
  return {
    id: item.id,
    uid: item.uid,
    type: "income",
    categoryName: item.category,
    amount: item.amount,
    paymentUid: item.paymentId,
    paymentName: item.paymentName,
    date: item.incomeDate,
    desc: item.remark,
    createTime: item.createdAt,
    createdAt: item.createdAt,
    status: item.status
  };
}

function mapExpenseOrderToTransaction(
  item: OtherExpenseOrder
): OtherTransaction {
  return {
    id: item.id,
    uid: item.uid,
    type: "expense",
    categoryName: item.category,
    amount: item.amount,
    paymentUid: item.paymentId,
    paymentName: item.paymentName,
    date: item.expenseDate,
    desc: item.remark,
    createTime: item.createdAt,
    createdAt: item.createdAt,
    status: item.status
  };
}

function buildMergedResult(
  list: OtherTransaction[],
  total: number
): CommonResult<PaginatedResponseDto<OtherTransaction>> {
  return {
    code: 200,
    msg: "success",
    data: {
      list,
      total
    }
  };
}

/** 获取其他收支列表 */
export async function getOtherTransactionListApi(
  index: number,
  params?: {
    type?: string;
    startDate?: string;
    endDate?: string;
    pageSize?: number;
  }
) {
  const pageSize = params?.pageSize ?? 10;

  if (params?.type === "income") {
    const result = await http.request<
      CommonResult<PaginatedResponseDto<OtherIncomeOrder>>
    >("get", baseUrlApi(`/other-income-order/${index}`), {
      params: {
        startDate: params.startDate,
        endDate: params.endDate,
        pageSize
      }
    });
    return buildMergedResult(
      (result.data.list ?? []).map(mapIncomeOrderToTransaction),
      result.data.total ?? 0
    );
  }

  if (params?.type === "expense") {
    const result = await http.request<
      CommonResult<PaginatedResponseDto<OtherExpenseOrder>>
    >("get", baseUrlApi(`/expense-order/${index}`), {
      params: {
        startDate: params.startDate,
        endDate: params.endDate,
        pageSize
      }
    });
    return buildMergedResult(
      (result.data.list ?? []).map(mapExpenseOrderToTransaction),
      result.data.total ?? 0
    );
  }

  const fetchSize = index * pageSize;
  const [incomeResult, expenseResult] = await Promise.all([
    http.request<CommonResult<PaginatedResponseDto<OtherIncomeOrder>>>(
      "get",
      baseUrlApi("/other-income-order/1"),
      {
        params: {
          startDate: params?.startDate,
          endDate: params?.endDate,
          pageSize: fetchSize
        }
      }
    ),
    http.request<CommonResult<PaginatedResponseDto<OtherExpenseOrder>>>(
      "get",
      baseUrlApi("/expense-order/1"),
      {
        params: {
          startDate: params?.startDate,
          endDate: params?.endDate,
          pageSize: fetchSize
        }
      }
    )
  ]);

  const total =
    (incomeResult.data.total ?? 0) + (expenseResult.data.total ?? 0);
  const merged = [
    ...(incomeResult.data.list ?? []).map(mapIncomeOrderToTransaction),
    ...(expenseResult.data.list ?? []).map(mapExpenseOrderToTransaction)
  ].sort((left, right) => {
    const leftTime = new Date(left.createdAt ?? left.date ?? 0).getTime();
    const rightTime = new Date(right.createdAt ?? right.date ?? 0).getTime();
    return rightTime - leftTime;
  });
  const start = Math.max(index - 1, 0) * pageSize;

  return buildMergedResult(merged.slice(start, start + pageSize), total);
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
