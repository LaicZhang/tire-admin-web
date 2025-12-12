export const columns: TableColumnList = [
  {
    label: "资产名称",
    prop: "name"
  },
  {
    label: "资产编号",
    prop: "uid",
    width: 200
  },
  {
    label: "资产类型",
    prop: "type",
    formatter: row => {
      const typeMap = {
        0: "固定资产",
        1: "无形资产",
        2: "其他资产"
      };
      return typeMap[row.type] || "未知";
    }
  },
  {
    label: "数量",
    prop: "count",
    width: 80
  },
  {
    label: "单位",
    prop: "unit",
    width: 80
  },
  {
    label: "原值",
    prop: "initValue",
    formatter: row =>
      row.initValue && row.initValue.value ? row.initValue.value : 0
  },
  {
    label: "当前价值",
    prop: "currentValue",
    formatter: row =>
      row.currentValue && row.currentValue.value ? row.currentValue.value : 0
  },
  {
    label: "状态",
    prop: "status",
    cellRenderer: ({ row }) => (row.status ? "正常" : "闲置")
  },
  {
    label: "是否自动折旧",
    prop: "isAuto",
    cellRenderer: ({ row }) => (row.isAuto ? "是" : "否")
  },
  {
    label: "备注",
    prop: "desc"
  },
  {
    label: "操作",
    fixed: "right",
    slot: "operation",
    width: 180
  }
];
