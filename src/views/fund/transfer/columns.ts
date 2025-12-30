import { getStatusInfo } from "./types";
import type { Transfer } from "./types";

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
    label: "转出账户",
    prop: "fromPaymentName",
    minWidth: 150,
    formatter: (row: Transfer) =>
      row.fromPayment?.name || row.fromPaymentName || "-"
  },
  {
    label: "转入账户",
    prop: "toPaymentName",
    minWidth: 150,
    formatter: (row: Transfer) =>
      row.toPayment?.name || row.toPaymentName || "-"
  },
  {
    label: "转账金额",
    prop: "amount",
    minWidth: 120,
    align: "right",
    formatter: (row: Transfer) => formatMoney(row.amount)
  },
  {
    label: "手续费",
    prop: "fee",
    minWidth: 100,
    align: "right",
    formatter: (row: Transfer) => (row.fee ? formatMoney(row.fee) : "-")
  },
  {
    label: "手续费承担方",
    prop: "feePaymentName",
    minWidth: 130,
    formatter: (row: Transfer) =>
      row.feePayment?.name || row.feePaymentName || "-"
  },
  {
    label: "转账日期",
    prop: "transferDate",
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
    width: 180,
    slot: "operation"
  }
];

export { getStatusInfo };
