export const columns: TableColumnList = [
  { label: "ID", prop: "id", width: 80 },
  { label: "客户名称", prop: "customerName" },
  { label: "商品名称", prop: "tireName" },
  { label: "客户商品编码", prop: "customerCode" },
  { label: "客户商品名称", prop: "customerProductName" },
  { label: "备注", prop: "remark" },
  { label: "创建时间", prop: "createdAt", width: 160 },
  {
    label: "操作",
    prop: "operation",
    slot: "operation",
    fixed: "right",
    minWidth: 140
  }
];
