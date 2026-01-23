export const columns = [
  {
    label: "文件名",
    minWidth: 200,
    slot: "fileName"
  },
  {
    label: "类型",
    width: 100,
    align: "center",
    slot: "type"
  },
  {
    label: "状态",
    width: 100,
    align: "center",
    slot: "status"
  },
  {
    label: "文件大小",
    width: 120,
    align: "right",
    slot: "fileSize"
  },
  {
    label: "创建时间",
    width: 180,
    slot: "createTime"
  },
  {
    label: "完成时间",
    width: 180,
    slot: "finishAt"
  },
  {
    label: "操作",
    width: 150,
    fixed: "right",
    slot: "operation"
  }
];
