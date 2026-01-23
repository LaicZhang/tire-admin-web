export const columns: TableColumnList = [
  {
    label: "顺序",
    type: "index",
    width: 80,
    align: "center"
  },
  {
    label: "取值方式",
    prop: "name",
    minWidth: 200
  },
  {
    label: "操作",
    width: 150,
    align: "center",
    slot: "operation"
  }
];
