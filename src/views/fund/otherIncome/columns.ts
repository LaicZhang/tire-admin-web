import { getIncomeTypeText, getStatusInfo } from "./types";
import type { OtherIncome } from "./types";

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
    label: "收入类型",
    prop: "incomeType",
    minWidth: 100,
    slot: "incomeType"
  },
  {
    label: "客户",
    prop: "customerName",
    minWidth: 130,
    formatter: (row: OtherIncome) =>
      row.customer?.name || row.customerName || "-"
  },
  {
    label: "金额",
    prop: "amount",
    minWidth: 110,
    align: "right",
    slot: "amount"
  },
  {
    label: "本次收款",
    prop: "receivedAmount",
    minWidth: 110,
    align: "right",
    formatter: (row: OtherIncome) => formatMoney(row.receivedAmount)
  },
  {
    label: "未收款",
    prop: "unpaidAmount",
    minWidth: 110,
    align: "right",
    formatter: (row: OtherIncome) => formatMoney(row.unpaidAmount)
  },
  {
    label: "收款账户",
    prop: "paymentName",
    minWidth: 120,
    formatter: (row: OtherIncome) => row.payment?.name || row.paymentName || "-"
  },
  {
    label: "收入日期",
    prop: "incomeDate",
    minWidth: 120
  },
  {
    label: "状态",
    prop: "status",
    minWidth: 90,
    slot: "status"
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
    width: 200,
    slot: "operation"
  }
];

export { getStatusInfo, getIncomeTypeText };
