import type { FundFlow, AccountBalance, ContactDebt } from "./types";

/** 格式化金额（分转元） */
function formatMoney(amount?: number): string {
  if (amount === undefined || amount === null) return "-";
  return `${(amount / 100).toFixed(2)}`;
}

/** 资金流水列 */
export const fundFlowColumns: TableColumnList = [
  {
    label: "流水号",
    prop: "serialNo",
    minWidth: 160,
    fixed: "left"
  },
  {
    label: "账户",
    prop: "paymentName",
    minWidth: 120
  },
  {
    label: "交易类型",
    prop: "transactionType",
    minWidth: 100
  },
  {
    label: "收支方向",
    prop: "direction",
    minWidth: 80,
    slot: "direction"
  },
  {
    label: "金额",
    prop: "amount",
    minWidth: 120,
    align: "right",
    slot: "amount"
  },
  {
    label: "交易前余额",
    prop: "beforeBalance",
    minWidth: 120,
    align: "right",
    formatter: (row: FundFlow) => formatMoney(row.beforeBalance)
  },
  {
    label: "交易后余额",
    prop: "afterBalance",
    minWidth: 120,
    align: "right",
    formatter: (row: FundFlow) => formatMoney(row.afterBalance)
  },
  {
    label: "往来单位",
    prop: "targetName",
    minWidth: 140
  },
  {
    label: "摘要",
    prop: "summary",
    minWidth: 150,
    showOverflowTooltip: true
  },
  {
    label: "关联单据",
    prop: "billNo",
    minWidth: 160
  },
  {
    label: "交易时间",
    prop: "transactionTime",
    minWidth: 160
  },
  {
    label: "经办人",
    prop: "operatorName",
    minWidth: 100
  }
];

/** 账户余额列 */
export const accountBalanceColumns: TableColumnList = [
  {
    label: "账户名称",
    prop: "paymentName",
    minWidth: 150,
    fixed: "left"
  },
  {
    label: "账户类型",
    prop: "accountType",
    minWidth: 100
  },
  {
    label: "期初余额",
    prop: "openingBalance",
    minWidth: 120,
    align: "right",
    formatter: (row: AccountBalance) => formatMoney(row.openingBalance)
  },
  {
    label: "本期收入",
    prop: "periodIncome",
    minWidth: 120,
    align: "right",
    slot: "income"
  },
  {
    label: "本期支出",
    prop: "periodExpense",
    minWidth: 120,
    align: "right",
    slot: "expense"
  },
  {
    label: "期末余额",
    prop: "closingBalance",
    minWidth: 120,
    align: "right",
    formatter: (row: AccountBalance) => formatMoney(row.closingBalance)
  }
];

/** 往来欠款列 */
export const contactDebtColumns: TableColumnList = [
  {
    label: "单位名称",
    prop: "targetName",
    minWidth: 150,
    fixed: "left"
  },
  {
    label: "单位类型",
    prop: "targetType",
    minWidth: 100,
    slot: "targetType"
  },
  {
    label: "应收金额",
    prop: "receivableAmount",
    minWidth: 120,
    align: "right",
    slot: "receivable"
  },
  {
    label: "应付金额",
    prop: "payableAmount",
    minWidth: 120,
    align: "right",
    slot: "payable"
  },
  {
    label: "净欠款",
    prop: "netDebt",
    minWidth: 120,
    align: "right",
    slot: "netDebt"
  },
  {
    label: "预收金额",
    prop: "advanceReceived",
    minWidth: 120,
    align: "right",
    formatter: (row: ContactDebt) => formatMoney(row.advanceReceived)
  },
  {
    label: "预付金额",
    prop: "advancePaid",
    minWidth: 120,
    align: "right",
    formatter: (row: ContactDebt) => formatMoney(row.advancePaid)
  }
];
