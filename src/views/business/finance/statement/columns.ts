export const columns: TableColumnList = [
  {
    label: "对账单号",
    prop: "statementNo",
    minWidth: 160
  },
  {
    label: "类型",
    prop: "type",
    minWidth: 100,
    formatter: ({ type }: { type: string }) =>
      type === "CUSTOMER" ? "客户对账" : "供应商对账"
  },
  {
    label: "往来单位",
    prop: "targetName",
    minWidth: 160
  },
  {
    label: "对账周期",
    prop: "period",
    minWidth: 200,
    formatter: ({
      startTime,
      endTime
    }: {
      startTime: string;
      endTime: string;
    }) => `${startTime} ~ ${endTime}`
  },
  {
    label: "应收/应付金额",
    prop: "amount",
    minWidth: 120
  },
  {
    label: "状态",
    prop: "status",
    minWidth: 100,
    slot: "status"
  },
  {
    label: "创建时间",
    prop: "createTime",
    minWidth: 160
  },
  {
    label: "操作",
    fixed: "right",
    width: 140,
    slot: "operation"
  }
];
