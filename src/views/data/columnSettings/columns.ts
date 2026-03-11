export const columns: TableColumnList = [
  { label: "序号", type: "index", width: 60 },
  { label: "字段名", prop: "field", width: 120 },
  { label: "列名称", prop: "label", width: 120 },
  { label: "别名", prop: "alias", slot: "alias" },
  { label: "是否显示", prop: "visible", slot: "visible", width: 100 },
  { label: "排序", prop: "sortOrder", slot: "sortOrder", width: 140 },
  {
    label: "操作",
    prop: "operation",
    slot: "operation",
    width: 100,
    fixed: "right"
  }
];
