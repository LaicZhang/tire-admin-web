import { getExpenseTypeText, getStatusInfo } from "./types";
import type { OtherExpense } from "./types";

/** 格式化金额（分转元） */
function formatMoney(amount?: number): string {
  if (amount === undefined || amount === null) return "-";
  return `${(amount / 100).toFixed(2)}`;
}

export const columns: TableColumnList = [
  {
    type: "selection",
    width: 55,
    align: "center"
  },
  {
    label: "单据编号",
    prop: "billNo",
    minWidth: 160,
    fixed: "left"
  },
  {
    label: "支出类型",
    prop: "expenseType",
    minWidth: 100,
    slot: "expenseType"
  },
  {
    label: "供应商",
    prop: "providerName",
    minWidth: 130,
    formatter: (row: OtherExpense) =>
      row.provider?.name || row.providerName || "-"
  },
  {
    label: "金额",
    prop: "amount",
    minWidth: 110,
    align: "right",
    slot: "amount"
  },
  {
    label: "本次付款",
    prop: "paidAmount",
    minWidth: 110,
    align: "right",
    formatter: (row: OtherExpense) => formatMoney(row.paidAmount)
  },
  {
    label: "未付款",
    prop: "unpaidAmount",
    minWidth: 110,
    align: "right",
    formatter: (row: OtherExpense) => formatMoney(row.unpaidAmount)
  },
  {
    label: "付款账户",
    prop: "paymentName",
    minWidth: 120,
    formatter: (row: OtherExpense) =>
      row.payment?.name || row.paymentName || "-"
  },
  {
    label: "支出日期",
    prop: "expenseDate",
    minWidth: 120
  },
  {
    label: "状态",
    prop: "status",
    minWidth: 90,
    slot: "status"
  },
  {
    label: "关联单据",
    prop: "relatedOrderNo",
    minWidth: 140,
    showOverflowTooltip: true
  },
  {
    label: "备注",
    prop: "remark",
    minWidth: 150,
    showOverflowTooltip: true
  },
  {
    label: "创建时间",
    prop: "createdAt",
    minWidth: 160
  },
  {
    label: "操作",
    fixed: "right",
    width: 220,
    slot: "operation"
  }
];

export { getStatusInfo, getExpenseTypeText };
