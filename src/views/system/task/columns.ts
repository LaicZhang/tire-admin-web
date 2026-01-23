import { h } from "vue";
import type { TableColumnRenderer } from "@pureadmin/table";

export const columns: TableColumnList = [
  {
    label: "任务名称",
    prop: "name",
    minWidth: 150
  },
  {
    label: "Service",
    prop: "service",
    minWidth: 120
  },
  {
    label: "Cron表达式",
    prop: "cron",
    minWidth: 120
  },
  {
    label: "参数",
    prop: "parameters",
    minWidth: 100
  },
  {
    label: "状态",
    prop: "status",
    minWidth: 80,
    cellRenderer: (data: TableColumnRenderer) =>
      h(
        "el-tag",
        { type: data.row?.status ? "success" : "info" },
        { default: () => (data.row?.status ? "启用" : "禁用") }
      )
  },
  {
    label: "下次执行时间",
    prop: "nextRunTime",
    minWidth: 160
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
    width: 250
  }
];
