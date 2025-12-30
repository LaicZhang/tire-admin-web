export const columns = [
  {
    label: "ID",
    prop: "id",
    minWidth: 60
  },
  {
    label: "职员姓名",
    prop: "name",
    minWidth: 120
  },
  {
    label: "昵称",
    prop: "nickname",
    minWidth: 100
  },
  {
    label: "部门",
    prop: "department",
    minWidth: 100
  },
  {
    label: "职位",
    prop: "position",
    minWidth: 100
  },
  {
    label: "电话",
    prop: "phone",
    minWidth: 120,
    slot: "phone"
  },
  {
    label: "状态",
    prop: "status",
    minWidth: 80,
    slot: "status"
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
