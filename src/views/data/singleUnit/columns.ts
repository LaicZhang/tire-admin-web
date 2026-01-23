import { h } from "vue";
import type { TableColumnRenderer } from "@pureadmin/table";

export const columns: TableColumnList = [
  {
    label: "单位名称",
    prop: "name",
    minWidth: 120
  },
  {
    label: "符号",
    prop: "symbol",
    minWidth: 100
  },
  {
    label: "默认",
    prop: "isDefault",
    minWidth: 80,
    cellRenderer: (data: TableColumnRenderer) =>
      h("span", data.row?.isDefault ? "是" : "否")
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
