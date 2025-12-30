/** 报表类型 */
export type ReportType =
  | "RECEIVABLE_PAYABLE" // 往来单位欠款表
  | "CONTACT_LIST" // 往来单位一览表
  | "CUSTOMER_STATEMENT" // 客户对账单
  | "PROVIDER_STATEMENT" // 供应商对账单
  | "RECEIVABLE_DETAIL" // 应收账款明细表
  | "PAYABLE_DETAIL" // 应付账款明细表
  | "OTHER_TRANSACTION" // 其他收支明细表
  | "CASH_BANK" // 现金银行报表
  | "PROFIT" // 利润表
  | "PURCHASE_SALE_EXPENSE"; // 采购销售费用表

/** 资金流水记录 */
export interface FundFlow {
  id: number;
  uid: string;
  /** 流水号 */
  serialNo: string;
  /** 单据编号 */
  billNo?: string;
  /** 单据类型 */
  billType?: string;
  /** 账户ID */
  paymentId: string;
  /** 账户名称 */
  paymentName?: string;
  /** 交易类型 */
  transactionType: string;
  /** 收支方向 */
  direction: "IN" | "OUT";
  /** 金额（分） */
  amount: number;
  /** 交易前余额（分） */
  beforeBalance?: number;
  /** 交易后余额（分） */
  afterBalance?: number;
  /** 往来单位 */
  targetName?: string;
  /** 摘要 */
  summary?: string;
  /** 交易时间 */
  transactionTime?: string;
  /** 经办人 */
  operatorName?: string;
  /** 创建时间 */
  createdAt?: string;
}

/** 账户余额统计 */
export interface AccountBalance {
  paymentId: string;
  paymentName: string;
  /** 账户类型 */
  accountType?: string;
  /** 期初余额（分） */
  openingBalance: number;
  /** 本期收入（分） */
  periodIncome: number;
  /** 本期支出（分） */
  periodExpense: number;
  /** 期末余额（分） */
  closingBalance: number;
}

/** 往来单位欠款 */
export interface ContactDebt {
  /** 单位ID */
  targetId: string;
  /** 单位名称 */
  targetName: string;
  /** 单位类型 */
  targetType: "CUSTOMER" | "PROVIDER";
  /** 应收金额（分） */
  receivableAmount: number;
  /** 应付金额（分） */
  payableAmount: number;
  /** 净欠款（分） */
  netDebt: number;
  /** 预收金额（分） */
  advanceReceived?: number;
  /** 预付金额（分） */
  advancePaid?: number;
}

/** 趋势数据点 */
export interface TrendDataPoint {
  date: string;
  income: number;
  expense: number;
  balance: number;
}

/** 查询资金报表参数 */
export interface FundReportQueryParams {
  reportType?: ReportType;
  paymentId?: string;
  targetType?: "CUSTOMER" | "PROVIDER";
  targetName?: string;
  startDate?: string;
  endDate?: string;
}

/** 报表类型选项 */
export const REPORT_TYPE_OPTIONS: {
  label: string;
  value: ReportType;
  group: string;
}[] = [
  { label: "往来单位欠款表", value: "RECEIVABLE_PAYABLE", group: "往来报表" },
  { label: "往来单位一览表", value: "CONTACT_LIST", group: "往来报表" },
  { label: "客户对账单", value: "CUSTOMER_STATEMENT", group: "往来报表" },
  { label: "供应商对账单", value: "PROVIDER_STATEMENT", group: "往来报表" },
  { label: "应收账款明细表", value: "RECEIVABLE_DETAIL", group: "账款报表" },
  { label: "应付账款明细表", value: "PAYABLE_DETAIL", group: "账款报表" },
  { label: "其他收支明细表", value: "OTHER_TRANSACTION", group: "账款报表" },
  { label: "现金银行报表", value: "CASH_BANK", group: "资金报表" },
  { label: "利润表", value: "PROFIT", group: "财务报表" },
  { label: "采购销售费用表", value: "PURCHASE_SALE_EXPENSE", group: "财务报表" }
];

/** 获取报表类型文本 */
export function getReportTypeText(type?: ReportType): string {
  const option = REPORT_TYPE_OPTIONS.find(o => o.value === type);
  return option?.label || "-";
}
