import { h } from "vue";
import type { TableColumnRenderer } from "@pureadmin/table";

export const columns: TableColumnList = [
  {
    label: "字典类型",
    prop: "name",
    minWidth: 120
  },
  {
    label: "键值",
    prop: "key",
    minWidth: 80
  },
  {
    label: "中文标签",
    prop: "cn",
    minWidth: 120
  },
  {
    label: "英文标签",
    prop: "en",
    minWidth: 120
  },
  {
    label: "公开",
    prop: "isPublic",
    minWidth: 80,
    cellRenderer: (data: TableColumnRenderer) =>
      h("span", data.row?.isPublic ? "是" : "否")
  },
  {
    label: "操作",
    fixed: "right",
    slot: "operation",
    width: 150
  }
];
