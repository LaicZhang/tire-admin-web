import { h } from "vue";
import type { TableColumnRenderer } from "@pureadmin/table";

export const columns: TableColumnList = [
  {
    label: "公告标题",
    prop: "title",
    minWidth: 200
  },
  {
    label: "公告类型",
    prop: "type",
    minWidth: 100,
    cellRenderer: (data: TableColumnRenderer) =>
      data.row?.type === 1 ? "通知" : "公告"
  },
  {
    label: "状态",
    prop: "status",
    minWidth: 80,
    cellRenderer: (data: TableColumnRenderer) =>
      h(
        "el-tag",
        { type: data.row?.status ? "success" : "info" },
        { default: () => (data.row?.status ? "正常" : "关闭") }
      )
  },
  {
    label: "创建时间",
    prop: "createTime",
    minWidth: 160
  },
  {
    label: "操作",
    fixed: "right",
    slot: "operation",
    width: 200
  }
];
