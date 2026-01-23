export const columns = [
  {
    label: "收入类型",
    prop: "type",
    width: 120,
    slot: "type"
  },
  {
    label: "金额",
    prop: "amount",
    width: 150,
    slot: "amount"
  },
  {
    label: "收款账户",
    prop: "payment.name",
    width: 150,
    slot: "payment"
  },
  {
    label: "分类",
    prop: "category",
    width: 120
  },
  {
    label: "备注",
    prop: "remark",
    minWidth: 200,
    showOverflowTooltip: true
  },
  {
    label: "创建时间",
    prop: "createdAt",
    width: 180,
    slot: "createdAt"
  }
];
