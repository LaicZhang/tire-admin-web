export const columns: TableColumnList = [
  { label: "ID", prop: "id", width: 80 },
  { label: "类型", prop: "type", slot: "type", width: 80 },
  { label: "模块", prop: "module", width: 100 },
  { label: "文件名", prop: "fileName" },
  { label: "状态", prop: "status", slot: "status", width: 100 },
  { label: "进度", prop: "progress", slot: "progress", width: 150 },
  { label: "创建时间", prop: "createdAt", width: 160 },
  {
    label: "操作",
    prop: "operation",
    slot: "operation",
    fixed: "right",
    minWidth: 140
  }
];
