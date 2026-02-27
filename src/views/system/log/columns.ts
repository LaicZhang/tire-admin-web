import { h } from "vue";
import type { TableColumnRenderer } from "@pureadmin/table";

export const columns: TableColumnList = [
  {
    label: "模块",
    prop: "module",
    minWidth: 100
  },
  {
    label: "traceId",
    prop: "traceId",
    minWidth: 220
  },
  {
    label: "方法",
    prop: "method",
    minWidth: 120
  },
  {
    label: "操作人",
    prop: "operator",
    minWidth: 100
  },
  {
    label: "IP",
    prop: "ip",
    minWidth: 120
  },
  {
    label: "耗时(ms)",
    prop: "duration",
    minWidth: 80
  },
  {
    label: "状态",
    prop: "success",
    minWidth: 80,
    cellRenderer: (data: TableColumnRenderer) =>
      h(
        "el-tag",
        { type: data.row?.success ? "success" : "danger" },
        { default: () => (data.row?.success ? "成功" : "失败") }
      )
  },
  {
    label: "时间",
    prop: "createdAt",
    minWidth: 160
  },
  {
    label: "操作",
    fixed: "right",
    slot: "operation",
    width: 220
  }
];
