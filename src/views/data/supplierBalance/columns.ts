export const columns: TableColumnList = [
  { type: "selection", width: 50 },
  { label: "ID", prop: "id", width: 80 },
  { label: "供应商名称", prop: "supplierName" },
  { label: "供应商编码", prop: "supplierCode", width: 120 },
  { label: "联系电话", prop: "phone", width: 130 },
  {
    label: "期初应付余额",
    prop: "payableBalance",
    slot: "payableBalance",
    width: 130
  },
  {
    label: "期初预付余额",
    prop: "prepaidBalance",
    slot: "prepaidBalance",
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
