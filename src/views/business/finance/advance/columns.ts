import { formatMoneyFromFen } from "@/utils/formatMoney";

export const columns: TableColumnList = [
  {
    label: "单号",
    prop: "billNo",
    minWidth: 160
  },
  {
    label: "类型",
    prop: "type",
    minWidth: 100,
    formatter: ({ type }: { type: string }) =>
      type === "RECEIPT" ? "预收款" : "预付款"
  },
  {
    label: "往来单位",
    prop: "targetName",
    minWidth: 160
  },
  {
    label: "金额",
    prop: "amount",
    minWidth: 120,
    formatter: ({ amount }: { amount?: string | number }) =>
      formatMoneyFromFen(Number(amount || 0))
  },
  {
    label: "剩余金额",
    prop: "remainingAmount",
    minWidth: 120,
    formatter: ({ remainingAmount }: { remainingAmount?: string | number }) =>
      formatMoneyFromFen(Number(remainingAmount || 0))
  },
  {
    label: "付款方式",
    prop: "paymentMethod",
    minWidth: 120,
    formatter: ({ paymentMethod }: { paymentMethod?: string }) =>
      paymentMethod || "-"
  },
  {
    label: "状态",
    prop: "status",
    minWidth: 120,
    slot: "status"
  },
  {
    label: "备注",
    prop: "remark",
    minWidth: 150,
    formatter: ({ remark }: { remark?: string }) => remark || "-"
  },
  {
    label: "创建时间",
    prop: "createTime",
    minWidth: 160
  },
  {
    label: "操作",
    fixed: "right",
    width: 220,
    slot: "operation"
  }
];
