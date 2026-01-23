export const columns: TableColumnList = [
  {
    label: "类型",
    prop: "type",
    formatter: ({ type }: { type: string }) =>
      type === "income" ? "收入" : "支出"
  },
  {
    label: "金额",
    prop: "amount"
  },
  {
    label: "账户",
    prop: "paymentUid"
  },
  {
    label: "日期",
    prop: "date"
  },
  {
    label: "描述",
    prop: "desc"
  }
];
