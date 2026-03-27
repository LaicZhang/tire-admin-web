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
  {
    label: "ATP",
    prop: "atpQuantity",
    width: 100,
    formatter: row => row.atpQuantity ?? row.count ?? 0
  },
  {
    label: "预占",
    prop: "reservedQuantity",
    width: 100,
    formatter: row => row.reservedQuantity ?? 0
  },
  {
    label: "已拣货",
    prop: "pickedQuantity",
    width: 100,
    formatter: row => row.pickedQuantity ?? 0
  },
  {
    label: "在途",
    prop: "inTransitQuantity",
    width: 100,
    formatter: row => row.inTransitQuantity ?? 0
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
