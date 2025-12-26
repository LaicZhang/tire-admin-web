export const columns: TableColumnList = [
  {
    label: "ID",
    prop: "id"
  },
  {
    label: "轮胎名",
    prop: "tireId",
    slot: "tireName"
  },
  {
    label: "是否锁定",
    prop: "isLocked",
    formatter: (row, column, cellValue) => {
      return cellValue ? "是" : "否";
    }
  },
  {
    label: "是否在库",
    prop: "isInRepo",
    formatter: (row, column, cellValue) => {
      return cellValue ? "是" : "否";
    }
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
