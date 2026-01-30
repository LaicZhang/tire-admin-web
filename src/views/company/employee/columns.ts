import { formatDate } from "@/utils";

export const columns: TableColumnList = [
  {
    label: "ID",
    prop: "id"
  },
  {
    label: "名字",
    prop: "name"
  },
  {
    label: "昵称",
    prop: "nickname"
  },
  {
    label: "状态",
    prop: "status",
    slot: "employeeStatus"
  },
  {
    label: "离职时间",
    prop: "layoffAt",
    formatter: (_row, _column, cellValue) => {
      return formatDate(cellValue);
    }
  },
  {
    label: "删除时间",
    prop: "deleteAt",
    formatter: (_row, _column, cellValue) => {
      return formatDate(cellValue);
    }
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
    label: "操作",
    fixed: "right",
    prop: "operation",
    slot: "operation"
  }
];
