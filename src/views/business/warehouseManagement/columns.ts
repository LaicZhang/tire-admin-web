export const columns: TableColumnList = [
  {
    label: "ID",
    prop: "uid"
  },
  {
    label: "仓库名称",
    prop: "name"
  },
  {
    label: "地址",
    prop: "address"
  },
  {
    label: "负责人",
    prop: "manager.name"
  },
  {
    label: "状态",
    prop: "status",
    cellRenderer: scope => (scope.row.status ? "启用" : "停用")
  },
  {
    label: "备注",
    prop: "desc"
  },
  {
    label: "操作",
    fixed: "right",
    width: 200,
    slot: "operation"
  }
];
