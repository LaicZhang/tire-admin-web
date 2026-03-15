export const columns: TableColumnList = [
  { label: "名称", prop: "name", minWidth: 200 },
  { label: "启用", width: 90, align: "center", slot: "enabled" },
  { label: "Cron", minWidth: 220, slot: "cron" },
  { label: "时区", width: 160, slot: "timeZone" },
  { label: "下次运行", width: 180, prop: "nextRunAt" },
  { label: "最近状态", width: 110, align: "center", slot: "lastStatus" },
  { label: "操作", width: 140, fixed: "right", slot: "operation" }
];
