export const columns: TableColumnList = [
  {
    label: "装箱单号",
    prop: "code"
  },
  {
    label: "创建时间",
    prop: "createdAt",
    formatter: ({ createdAt }: { createdAt: string }) =>
      new Date(createdAt).toLocaleString()
  },
  {
    label: "商品数量",
    prop: "itemCount"
  },
  {
    label: "状态",
    prop: "status",
    formatter: ({ status }: { status: number }) =>
      status === 1 ? "已完成" : "进行中"
  },
  {
    label: "备注",
    prop: "remark"
  }
];
