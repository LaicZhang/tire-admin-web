export const columns = [
  {
    label: "ID",
    prop: "id"
  },
  {
    label: "轮胎名",
    prop: "tireId"
  },
  {
    label: "是否锁定",
    prop: "isLocked"
  },
  {
    label: "是否在库",
    prop: "isInRepo"
  },
  {
    label: "备注",
    prop: "desc"
  },
  {
    label: "操作",
    fixed: "right",
    prop: "operation",
    slot: "operation",
    minWidth: 120
  }
];
