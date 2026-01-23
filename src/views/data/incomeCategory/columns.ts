export const columns = [
  {
    type: "selection",
    width: 55,
    align: "center"
  },
  {
    label: "编码",
    prop: "code",
    minWidth: 120
  },
  {
    label: "名称",
    prop: "name",
    minWidth: 150
  },
  {
    label: "排序",
    prop: "sort",
    minWidth: 80
  },
  {
    label: "备注",
    prop: "remark",
    minWidth: 150
  },
  {
    label: "操作",
    fixed: "right",
    slot: "operation",
    width: 150
  }
];
