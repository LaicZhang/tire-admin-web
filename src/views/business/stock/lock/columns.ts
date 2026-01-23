export const columns: TableColumnList = [
  {
    label: "货位名称",
    prop: "name"
  },
  {
    label: "所属仓库",
    prop: "repoName"
  },
  {
    label: "状态",
    prop: "isLocked",
    formatter: ({ isLocked }: { isLocked: boolean }) =>
      isLocked ? "已锁定" : "正常"
  },
  {
    label: "锁定原因",
    prop: "lockReason"
  },
  {
    label: "操作",
    fixed: "right",
    slot: "operation"
  }
];
