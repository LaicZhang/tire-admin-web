export const columns = [
  {
    label: "序号",
    type: "index",
    width: 60,
    align: "center"
  },
  {
    label: "流程名称",
    prop: "name",
    minWidth: 150
  },
  {
    label: "描述",
    prop: "description",
    minWidth: 200,
    showOverflowTooltip: true
  },
  {
    label: "状态",
    prop: "status",
    width: 100,
    align: "center",
    slot: "status"
  },
  {
    label: "创建时间",
    prop: "createTime",
    width: 180,
    align: "center"
  },
  {
    label: "操作",
    width: 180,
    fixed: "right",
    align: "center",
    slot: "operation"
  }
];
