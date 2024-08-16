export const columns = [
  {
    label: "ID",
    prop: "id"
  },
  {
    label: "仓库",
    prop: "name"
  },
  {
    label: "地址",
    prop: "address"
  },
  {
    label: "状态",
    prop: "status",
    formatter: (row, column, cellValue) => {
      return cellValue === true ? "正常" : "停用";
    }
  },
  {
    label: "备注",
    prop: "desc"
  },
  {
    label: "启用时间",
    prop: "startAt"
  },
  {
    label: "到期时间",
    prop: "endAt"
  },
  {
    label: "操作",
    fixed: "right",
    prop: "operation",
    slot: "operation",
    minWidth: 120
  }
];
