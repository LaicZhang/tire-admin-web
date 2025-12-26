import { formatDate } from "@/utils";

export const columns: TableColumnList = [
  // {
  //   label: "ID",
  //   prop: "id"
  // },
  {
    label: "编码",
    prop: "name"
  },
  {
    label: "名称",
    prop: "cn"
  },
  {
    label: "职级",
    prop: "level"
  },
  {
    label: "备注",
    prop: "desc"
  },
  {
    label: "更新时间",
    prop: "updateAt",
    formatter: (row, column, cellValue) => {
      return formatDate(cellValue);
    }
  },
  {
    label: "创建时间",
    prop: "createAt",
    formatter: (row, column, cellValue) => {
      return formatDate(cellValue);
    }
  },
  {
    label: "操作",
    fixed: "right",
    prop: "operation",
    slot: "operation"
  }
];
