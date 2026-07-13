import { maskBankAccountDisplay } from "@/utils/presentationMask";

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
    minWidth: 180,
    formatter: ({ bankAccount }) => maskBankAccountDisplay(bankAccount)
  },
  {
    label: "当前余额",
    prop: "balance",
    minWidth: 120,
    slot: "balance"
  },
  {
    label: "状态",
    prop: "status",
    minWidth: 90,
    formatter: ({ status }) => (status === false ? "停用" : "启用")
  },
  {
    label: "操作",
    fixed: "right",
    prop: "operation",
    slot: "operation",
    minWidth: 180
  }
];
