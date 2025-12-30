import dayjs from "dayjs";
import {
  recalcScopeMap,
  recalcStatusMap,
  type RecalcScope,
  type RecalcStatus
} from "./types";

export const columns: TableColumnList = [
  {
    label: "任务ID",
    prop: "uid",
    width: 160
  },
  {
    label: "重算范围",
    prop: "scope",
    width: 120,
    cellRenderer: ({ row }) => {
      const scope = row.scope as RecalcScope;
      const config = recalcScopeMap[scope];
      return config?.label || scope;
    }
  },
  {
    label: "商品/类别",
    prop: "tireName",
    minWidth: 150,
    formatter: row => row.tireName || row.categoryName || "全部商品"
  },
  {
    label: "状态",
    prop: "status",
    width: 100,
    cellRenderer: ({ row }) => {
      const status = row.status as RecalcStatus;
      const config = recalcStatusMap[status];
      return (
        <el-tag type={config?.type || "info"} size="small">
          {config?.label || status}
        </el-tag>
      );
    }
  },
  {
    label: "进度",
    prop: "progress",
    width: 150,
    cellRenderer: ({ row }) => (
      <el-progress
        percentage={row.progress || 0}
        status={row.status === "completed" ? "success" : undefined}
      />
    )
  },
  {
    label: "处理数",
    prop: "processedItems",
    width: 120,
    formatter: row => `${row.processedItems || 0} / ${row.totalItems || 0}`
  },
  {
    label: "操作人",
    prop: "operatorName",
    width: 100
  },
  {
    label: "创建时间",
    prop: "createdAt",
    width: 160,
    formatter: row =>
      row.createdAt ? dayjs(row.createdAt).format("YYYY-MM-DD HH:mm") : "-"
  },
  {
    label: "完成时间",
    prop: "completedAt",
    width: 160,
    formatter: row =>
      row.completedAt ? dayjs(row.completedAt).format("YYYY-MM-DD HH:mm") : "-"
  },
  {
    label: "操作",
    fixed: "right",
    slot: "operation",
    width: 150
  }
];
