export const columns: TableColumnList = [
  {
    label: "ID",
    prop: "id",
    minWidth: 60
  },
  {
    label: "客户名称",
    prop: "name",
    minWidth: 150
  },
  {
    label: "联系人",
    prop: "contact",
    minWidth: 100
  },
  {
    label: "电话",
    prop: "phone",
    minWidth: 120
  },
  {
    label: "地址",
    prop: "address",
    minWidth: 200
  },
  {
    label: "等级",
    prop: "level",
    minWidth: 100,
    slot: "level"
  },
  {
    label: "备注",
    prop: "desc",
    minWidth: 120
  },
  {
    label: "删除时间",
    prop: "deleteAt",
    minWidth: 160,
    formatter: ({ deleteAt }) => {
      return deleteAt ? deleteAt.replace("T", " ").substring(0, 19) : "-";
    }
  },
  {
    label: "操作",
    fixed: "right",
    prop: "operation",
    slot: "operation",
    minWidth: 180
  }
];
