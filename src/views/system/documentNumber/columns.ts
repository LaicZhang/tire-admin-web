export const columns = [
  {
    label: "单据类型",
    width: 150,
    slot: "documentType"
  },
  {
    label: "前缀",
    width: 100,
    prop: "prefix"
  },
  {
    label: "日期格式",
    width: 150,
    slot: "dateFormat"
  },
  {
    label: "序号位数",
    width: 100,
    prop: "sequenceDigits",
    align: "center"
  },
  {
    label: "分隔符",
    width: 80,
    align: "center",
    slot: "separator"
  },
  {
    label: "重置周期",
    width: 120,
    slot: "resetCycle"
  },
  {
    label: "示例",
    minWidth: 200,
    slot: "example"
  },
  {
    label: "操作",
    width: 100,
    fixed: "right",
    slot: "operation"
  }
];
