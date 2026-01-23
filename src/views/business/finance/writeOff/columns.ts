export const columns: TableColumnList = [
  {
    label: "核销单号",
    prop: "uid",
    minWidth: 180
  },
  {
    label: "核销类型",
    prop: "type",
    minWidth: 100,
    formatter: ({ type }: { type: string }) =>
      type === "OFFSET" ? "互抵核销" : "坏账核销"
  },
  {
    label: "客户",
    prop: "customer",
    minWidth: 120,
    formatter: ({ customer }: { customer: { name: string } | null }) =>
      customer?.name || "-"
  },
  {
    label: "供应商",
    prop: "provider",
    minWidth: 120,
    formatter: ({ provider }: { provider: { name: string } | null }) =>
      provider?.name || "-"
  },
  {
    label: "应收金额",
    prop: "receivableAmount",
    minWidth: 110,
    formatter: ({ receivableAmount }: { receivableAmount: number }) =>
      `¥${(receivableAmount / 100).toFixed(2)}`
  },
  {
    label: "应付金额",
    prop: "payableAmount",
    minWidth: 110,
    formatter: ({ payableAmount }: { payableAmount: number }) =>
      `¥${(payableAmount / 100).toFixed(2)}`
  },
  {
    label: "核销金额",
    prop: "writeOffAmount",
    minWidth: 110,
    formatter: ({ writeOffAmount }: { writeOffAmount: number }) =>
      `¥${(writeOffAmount / 100).toFixed(2)}`
  },
  {
    label: "审核状态",
    prop: "isApproved",
    minWidth: 100,
    slot: "status"
  },
  {
    label: "创建时间",
    prop: "createAt",
    minWidth: 160
  },
  {
    label: "操作",
    fixed: "right",
    width: 200,
    slot: "operation"
  }
];
