import type { Transfer } from "./types";
import { fenToYuanOrDash } from "@/utils/formatMoney";

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
    formatter: (row: Transfer) => fenToYuanOrDash(row.amount)
  },
  {
    label: "手续费",
    prop: "fee",
    minWidth: 100,
    align: "right",
    formatter: (row: Transfer) => (row.fee ? fenToYuanOrDash(row.fee) : "-")
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
