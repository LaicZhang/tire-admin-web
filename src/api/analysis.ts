import { http } from "../utils/http";
import { baseUrlApi } from "./utils";
import type { CommonResult } from "./type";

const prefix = "/analysis/";

// 销售汇总
export async function getSalesSummaryApi(params?: {
  startDate?: string;
  endDate?: string;
}) {
  return await http.request<CommonResult>(
    "get",
    baseUrlApi(prefix + "sales/summary"),
    { params }
  );
}

// 销售趋势
export async function getSalesTrendApi(params?: {
  startDate?: string;
  endDate?: string;
  groupBy?: "day" | "week" | "month";
}) {
  return await http.request<CommonResult>(
    "get",
    baseUrlApi(prefix + "sales/trend"),
    { params }
  );
}

// 采购汇总
export async function getPurchaseSummaryApi(params?: {
  startDate?: string;
  endDate?: string;
}) {
  return await http.request<CommonResult>(
    "get",
    baseUrlApi(prefix + "purchase/summary"),
    { params }
  );
}

// 库存汇总
export async function getInventorySummaryApi() {
  return await http.request<CommonResult>(
    "get",
    baseUrlApi(prefix + "inventory/summary")
  );
}

// 应收账龄分析
export async function getReceivableAgingApi(params?: {
  startDate?: string;
  endDate?: string;
  agingDays?: number[];
}) {
  return await http.request<CommonResult>(
    "get",
    baseUrlApi(prefix + "receivable/aging"),
    { params }
  );
}

// 应付账龄分析
export async function getPayableAgingApi(params?: {
  startDate?: string;
  endDate?: string;
  agingDays?: number[];
}) {
  return await http.request<CommonResult>(
    "get",
    baseUrlApi(prefix + "payable/aging"),
    { params }
  );
}

// 客户排行榜
export async function getCustomerRankingApi(params?: {
  startDate?: string;
  endDate?: string;
  limit?: number;
}) {
  return await http.request<CommonResult>(
    "get",
    baseUrlApi(prefix + "ranking/customers"),
    { params }
  );
}

// 供应商排行榜
export async function getProviderRankingApi(params?: {
  startDate?: string;
  endDate?: string;
  limit?: number;
}) {
  return await http.request<CommonResult>(
    "get",
    baseUrlApi(prefix + "ranking/providers"),
    { params }
  );
}

// 商品排行榜
export async function getProductRankingApi(params?: {
  startDate?: string;
  endDate?: string;
  limit?: number;
  orderBy?: "quantity" | "amount" | "profit";
}) {
  return await http.request<CommonResult>(
    "get",
    baseUrlApi(prefix + "ranking/products"),
    { params }
  );
}

// 员工排行榜
export async function getOperatorRankingApi(params?: {
  startDate?: string;
  endDate?: string;
  limit?: number;
  orderBy?: "amount" | "count" | "collectionRate";
}) {
  return await http.request<CommonResult>(
    "get",
    baseUrlApi(prefix + "ranking/operators"),
    { params }
  );
}

// 采购明细
export async function getPurchaseDetailApi(params?: {
  index?: number;
  startDate?: string;
  endDate?: string;
  providerId?: string;
  tireId?: string;
}) {
  return await http.request<CommonResult>(
    "get",
    baseUrlApi(prefix + "purchase/detail"),
    { params }
  );
}

// 销售明细
export async function getSaleDetailApi(params?: {
  index?: number;
  startDate?: string;
  endDate?: string;
  customerId?: string;
  operatorId?: string;
}) {
  return await http.request<CommonResult>(
    "get",
    baseUrlApi(prefix + "sale/detail"),
    { params }
  );
}

// 退货率分析
export async function getReturnRateApi(params?: {
  startDate?: string;
  endDate?: string;
  dimension?: "tire" | "provider";
}) {
  return await http.request<CommonResult>(
    "get",
    baseUrlApi(prefix + "return-rate"),
    { params }
  );
}

// 理赔损失分析
export async function getClaimLossApi(params?: {
  startDate?: string;
  endDate?: string;
}) {
  return await http.request<CommonResult>(
    "get",
    baseUrlApi(prefix + "claim-loss"),
    { params }
  );
}

// 滞销商品分析
export async function getSlowMovingApi(params?: { days?: number }) {
  return await http.request<CommonResult>(
    "get",
    baseUrlApi(prefix + "slow-moving"),
    { params }
  );
}

// 库存周转率
export async function getInventoryTurnoverApi(params?: { repoId?: string }) {
  return await http.request<CommonResult>(
    "get",
    baseUrlApi(prefix + "inventory-turnover"),
    { params }
  );
}

// 临期分布
export async function getExpiryDistributionApi(params?: {
  repoId?: string;
  days?: string;
}) {
  return await http.request<CommonResult>(
    "get",
    baseUrlApi(prefix + "expiry-distribution"),
    { params }
  );
}

// 缺货分析
export async function getStockoutApi() {
  return await http.request<CommonResult>(
    "get",
    baseUrlApi(prefix + "stockout")
  );
}

// 报表导出
export async function exportReportApi(params?: {
  startDate?: string;
  endDate?: string;
  format?: "excel";
}) {
  return await http.request<Blob>("get", baseUrlApi(prefix + "export"), {
    params,
    responseType: "blob"
  });
}

// 利润核算 - 毛利分析
export async function getGrossProfitApi(params?: {
  startDate?: string;
  endDate?: string;
  groupBy?: "day" | "week" | "month";
}) {
  return await http.request<CommonResult>(
    "get",
    baseUrlApi(prefix + "profit/gross"),
    { params }
  );
}

// 利润核算 - 净利润分析
export async function getNetProfitApi(params?: {
  startDate?: string;
  endDate?: string;
  groupBy?: "day" | "week" | "month";
}) {
  return await http.request<CommonResult>(
    "get",
    baseUrlApi(prefix + "profit/net"),
    { params }
  );
}

// 资金报表 - 收支汇总
export async function getIncomeExpenseSummaryApi(params?: {
  startDate?: string;
  endDate?: string;
}) {
  return await http.request<CommonResult>(
    "get",
    baseUrlApi(prefix + "finance/summary"),
    { params }
  );
}

// 资金报表 - 现金流分析
export async function getCashFlowApi(params?: {
  startDate?: string;
  endDate?: string;
  groupBy?: "day" | "week" | "month";
}) {
  return await http.request<CommonResult>(
    "get",
    baseUrlApi(prefix + "finance/cashflow"),
    { params }
  );
}

// 资金报表 - 账户余额趋势
export async function getBalanceTrendApi(params?: {
  startDate?: string;
  endDate?: string;
  paymentUid?: string;
}) {
  return await http.request<CommonResult>(
    "get",
    baseUrlApi(prefix + "finance/balance-trend"),
    { params }
  );
}
