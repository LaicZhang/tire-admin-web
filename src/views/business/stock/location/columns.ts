export const columns: TableColumnList = [
  {
    label: "库区名称",
    prop: "name"
  },
  {
    label: "所属仓库",
    prop: "repoName"
  },
  {
    label: "货位数量",
    prop: "binCount"
  },
  {
    label: "操作",
    fixed: "right",
    slot: "operation"
  }
];
