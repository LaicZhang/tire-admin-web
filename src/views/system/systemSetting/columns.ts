export const columns: TableColumnList = [
  { label: "分组", prop: "group", minWidth: 120 },
  { label: "Key", prop: "key", minWidth: 220 },
  { label: "值", minWidth: 260, slot: "value" },
  { label: "公开", width: 90, align: "center", slot: "isPublic" },
  { label: "操作", width: 160, fixed: "right", slot: "operation" }
];
