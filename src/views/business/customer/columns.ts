export const columns: TableColumnList = [
  {
    label: "ID",
    prop: "id"
  },
  {
    label: "名称",
    prop: "name"
  },
  {
    label: "等级",
    prop: "level"
  },
  {
    label: "总消费",
    prop: "totalTransactionAmount"
  },
  {
    label: "限制",
    prop: "limit"
  },
  {
    label: "客户来源",
    prop: "from"
  },
  {
    label: "是否公开",
    prop: "isPublic",
    formatter: (row, column, cellValue) => {
      return cellValue === true ? "公开" : "不公开";
    }
  },
  {
    label: "备注",
    prop: "desc"
  },
  {
    label: "操作",
    fixed: "right",
    prop: "operation",
    slot: "operation",
    minWidth: 120
  }
];
