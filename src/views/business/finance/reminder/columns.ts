export const columns: TableColumnList = [
  {
    label: "客户",
    prop: "customerUid"
  },
  {
    label: "金额",
    prop: "amount"
  },
  {
    label: "到期日",
    prop: "dueDate"
  },
  {
    label: "内容",
    prop: "content"
  },
  {
    label: "状态",
    prop: "status",
    formatter: ({ status }: { status: string }) =>
      status === "pending" ? "待处理" : "已处理"
  }
];
