import { getPaymentMethodText, getStatusInfo } from "./types";
import type { PaymentOrder } from "./types";
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
    label: "供应商",
    prop: "providerName",
    minWidth: 150,
    formatter: (row: PaymentOrder) =>
      row.provider?.name || row.providerName || "-"
  },
  {
    label: "付款金额",
    prop: "amount",
    minWidth: 120,
    align: "right",
    formatter: (row: PaymentOrder) => fenToYuanOrDash(row.amount)
  },
  {
    label: "本次核销",
    prop: "writeOffAmount",
    minWidth: 120,
    align: "right",
    formatter: (row: PaymentOrder) => fenToYuanOrDash(row.writeOffAmount)
  },
  {
    label: "本次预付",
    prop: "advanceAmount",
    minWidth: 120,
    align: "right",
    formatter: (row: PaymentOrder) => fenToYuanOrDash(row.advanceAmount)
  },
  {
    label: "结算账户",
    prop: "paymentName",
    minWidth: 130,
    formatter: (row: PaymentOrder) =>
      row.payment?.name || row.paymentName || "-"
  },
  {
    label: "付款方式",
    prop: "paymentMethod",
    minWidth: 100,
    formatter: (row: PaymentOrder) => getPaymentMethodText(row.paymentMethod)
  },
  {
    label: "付款日期",
    prop: "paymentDate",
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

/** 明细表格列 */
export const detailColumns: TableColumnList = [
  {
    label: "源单据编号",
    prop: "sourceOrderNo",
    minWidth: 160
  },
  {
    label: "源单据类型",
    prop: "sourceOrderType",
    minWidth: 100
  },
  {
    label: "应付金额",
    prop: "payableAmount",
    minWidth: 120,
    align: "right",
    formatter: (row: { payableAmount?: number }) =>
      fenToYuanOrDash(row.payableAmount)
  },
  {
    label: "本次核销金额",
    prop: "writeOffAmount",
    minWidth: 120,
    align: "right",
    formatter: (row: { writeOffAmount?: number }) =>
      fenToYuanOrDash(row.writeOffAmount)
  },
  {
    label: "备注",
    prop: "remark",
    minWidth: 150
  }
];

export { getStatusInfo };
