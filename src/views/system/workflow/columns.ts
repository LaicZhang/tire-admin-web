export const columns: TableColumnList = [
  {
    label: "序号",
    type: "index",
    width: 60,
    align: "center"
  },
  {
    label: "流程名称",
    prop: "name",
    minWidth: 140
  },
  {
    label: "单据类型",
    prop: "targetType",
    minWidth: 120
  },
  {
    label: "策略",
    prop: "strategy",
    width: 90,
    align: "center"
  },
  {
    label: "金额区间",
    prop: "amountRange",
    minWidth: 140,
    slot: "amountRange"
  },
  {
    label: "启用",
    prop: "isEnabled",
    width: 90,
    align: "center",
    slot: "status"
  },
  {
    label: "创建时间",
    prop: "createdAt",
    width: 180,
    align: "center"
  },
  {
    label: "操作",
    width: 160,
    fixed: "right",
    align: "center",
    slot: "operation"
  }
];
