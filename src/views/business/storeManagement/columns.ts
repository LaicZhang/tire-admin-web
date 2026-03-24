export const columns: TableColumnList = [
  {
    label: "ID",
    prop: "uid"
  },
  {
    label: "门店名称",
    prop: "name"
  },
  {
    label: "默认仓库",
    prop: "defaultRepository.name"
  },
  {
    label: "地址",
    prop: "address"
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
    width: 220,
    slot: "operation"
  }
];
