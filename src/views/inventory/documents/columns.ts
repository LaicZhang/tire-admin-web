export const columns: TableColumnList = [
  {
    type: "selection",
    width: 55,
    align: "center"
  },
  {
    label: "单据编号",
    prop: "billNo",
    minWidth: 160,
    fixed: "left"
  },
  {
    label: "单据类型",
    prop: "documentType",
    minWidth: 120,
    slot: "documentType"
  },
  {
    label: "仓库/对象",
    prop: "targetName",
    minWidth: 140
  },
  {
    label: "数量",
    prop: "count",
    minWidth: 90,
    align: "right"
  },
  {
    label: "金额",
    prop: "amount",
    minWidth: 120,
    align: "right",
    slot: "amount"
  },
  {
    label: "状态",
    prop: "status",
    minWidth: 100,
    slot: "status"
  },
  {
    label: "操作人",
    prop: "operatorName",
    minWidth: 100
  },
  {
    label: "备注",
    prop: "remark",
    minWidth: 160,
    showOverflowTooltip: true
  },
  {
    label: "创建时间",
    prop: "createdAt",
    minWidth: 160
  },
  {
    label: "操作",
    fixed: "right",
    width: 240,
    slot: "operation"
  }
];
