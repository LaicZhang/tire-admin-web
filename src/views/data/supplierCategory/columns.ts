import { h } from "vue";
import type { TableColumnRenderer } from "@pureadmin/table";

export const columns: TableColumnList = [
  {
    label: "类别名称",
    prop: "name",
    minWidth: 200,
    align: "left"
  },
  {
    label: "层级",
    prop: "level",
    minWidth: 80,
    cellRenderer: (data: TableColumnRenderer) =>
      h("span", `第${data.row?.level || 1}级`)
  },
  {
    label: "排序",
    prop: "sort",
    minWidth: 80
  },
  {
    label: "操作",
    fixed: "right",
    slot: "operation",
    width: 200
  }
];
