export const columns = [
  {
    label: "ID",
    prop: "id",
    minWidth: 60
  },
  {
    label: "仓库编码",
    prop: "code",
    minWidth: 120
  },
  {
    label: "仓库名称",
    prop: "name",
    minWidth: 150
  },
  {
    label: "地址",
    prop: "address",
    minWidth: 200
  },
  {
    label: "负责人",
    prop: "manager",
    minWidth: 100
  },
  {
    label: "联系电话",
    prop: "phone",
    minWidth: 120
  },
  {
    label: "备注",
    prop: "desc",
    minWidth: 120
  },
  {
    label: "操作",
    fixed: "right",
    prop: "operation",
    slot: "operation",
    minWidth: 180
  }
];
