import { fenToYuanOrDash } from "@/utils/formatMoney";
import { getPaymentMethodText, type ReceiptOrder } from "./types";

export const columns: TableColumnList = [
  {
    type: "selection",
    width: 55,
    align: "center"
  },
  {
    label: "单据编号",
    prop: "billNo",
    minWidth: 180,
    fixed: "left"
  },
  {
    label: "客户",
    prop: "customerName",
    minWidth: 150,
    formatter: (row: ReceiptOrder) =>
      row.customer?.name || row.customerName || "-"
  },
  {
    label: "收款金额",
    prop: "amount",
    minWidth: 120,
    align: "right",
    formatter: (row: ReceiptOrder) => fenToYuanOrDash(row.amount)
  },
  {
    label: "本次核销",
    prop: "writeOffAmount",
    minWidth: 120,
    align: "right",
    formatter: (row: ReceiptOrder) => fenToYuanOrDash(row.writeOffAmount)
  },
  {
    label: "本次预收",
    prop: "advanceAmount",
    minWidth: 120,
    align: "right",
    formatter: (row: ReceiptOrder) => fenToYuanOrDash(row.advanceAmount)
  },
  {
    label: "结算账户",
    prop: "paymentName",
    minWidth: 130,
    formatter: (row: ReceiptOrder) =>
      row.payment?.name || row.paymentName || "-"
  },
  {
    label: "收款方式",
    prop: "paymentMethod",
    minWidth: 100,
    formatter: (row: ReceiptOrder) => getPaymentMethodText(row.paymentMethod)
  },
  {
    label: "收款日期",
    prop: "receiptDate",
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
    minWidth: 180,
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
