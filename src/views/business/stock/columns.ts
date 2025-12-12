export const columns: TableColumnList = [
  {
    label: "轮胎名称",
    prop: "tire.name",
    formatter: row => row.tire?.name || "未知"
  },
  {
    label: "仓库",
    prop: "repo.name",
    formatter: row => row.repo?.name || "未知"
  },
  {
    label: "批次号",
    prop: "batchNo"
  },
  {
    label: "系统库存",
    prop: "count",
    width: 100
  },
  // {
  //   label: "实际库存",
  //   prop: "actualCount",
  //   slot: "actualCount",
  //   width: 150
  // },
  {
    label: "操作",
    fixed: "right",
    slot: "operation",
    width: 120
  }
];
