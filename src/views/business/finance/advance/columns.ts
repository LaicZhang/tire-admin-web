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
    minWidth: 120
  },
  {
    label: "剩余金额",
    prop: "remainingAmount",
    minWidth: 120
  },
  {
    label: "付款方式",
    prop: "paymentMethod",
    minWidth: 120
  },
  {
    label: "备注",
    prop: "remark",
    minWidth: 150
  },
  {
    label: "创建时间",
    prop: "createTime",
    minWidth: 160
  },
  {
    label: "操作",
    fixed: "right",
    width: 140,
    slot: "operation"
  }
];
