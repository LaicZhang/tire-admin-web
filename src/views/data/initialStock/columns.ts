export const columns: TableColumnList = [
  { type: "selection", width: 50 },
  { label: "ID", prop: "id", width: 80 },
  { label: "商品名称", prop: "tireName" },
  { label: "仓库", prop: "repoName", width: 120 },
  { label: "期初数量", prop: "quantity", width: 100 },
  { label: "成本单价", prop: "costPrice", width: 100 },
  { label: "成本金额", prop: "costAmount", width: 120 },
  { label: "批次号", prop: "batchNo", width: 120 },
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
