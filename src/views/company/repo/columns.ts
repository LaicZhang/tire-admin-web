import { formatDate } from "@/utils";

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
    prop: "startAt",
    formatter: (row, column, cellValue) => {
      return formatDate(cellValue);
    }
  },
  {
    label: "到期时间",
    prop: "endAt",
    formatter: (row, column, cellValue) => {
      return formatDate(cellValue);
    }
  },
  {
    label: "操作",
    fixed: "right",
    prop: "operation",
    slot: "operation",
    minWidth: 120
  }
];
