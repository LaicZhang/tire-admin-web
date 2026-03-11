export const columns: TableColumnList = [
  { type: "selection", width: 50 },
  { label: "ID", prop: "id", width: 80 },
  { label: "客户名称", prop: "customerName" },
  { label: "客户编码", prop: "customerCode", width: 120 },
  { label: "联系电话", prop: "phone", width: 130 },
  {
    label: "期初应收余额",
    prop: "receivableBalance",
    slot: "receivableBalance",
    width: 130
  },
  {
    label: "期初预收余额",
    prop: "advanceBalance",
    slot: "advanceBalance",
    width: 130
  },
  { label: "余额日期", prop: "balanceDate", width: 120 },
  { label: "备注", prop: "remark" },
  {
    label: "操作",
    prop: "operation",
    slot: "operation",
    fixed: "right",
    minWidth: 140
  }
];
