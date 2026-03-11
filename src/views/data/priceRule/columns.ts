export const columns: TableColumnList = [
  { label: "优先级", prop: "priority", width: 80 },
  { label: "规则名称", prop: "name", width: 150 },
  { label: "规则代码", prop: "code", width: 180 },
  { label: "规则描述", prop: "description" },
  { label: "启用状态", prop: "enabled", slot: "enabled", width: 100 },
  { label: "排序", prop: "sort", slot: "sort", width: 120 }
];
