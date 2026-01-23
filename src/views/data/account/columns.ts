export const columns: TableColumnList = [
  {
    label: "账户名称",
    prop: "name",
    minWidth: 150
  },
  {
    label: "账户类型",
    prop: "accountType",
    minWidth: 100
  },
  {
    label: "开户行",
    prop: "bankName",
    minWidth: 150
  },
  {
    label: "银行账号",
    prop: "bankAccount",
    minWidth: 180
  },
  {
    label: "当前余额",
    prop: "balance",
    minWidth: 120,
    slot: "balance"
  },
  {
    label: "操作",
    fixed: "right",
    prop: "operation",
    slot: "operation",
    minWidth: 180
  }
];
