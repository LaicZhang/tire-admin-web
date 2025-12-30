import dayjs from "dayjs";
import { stocktakingStatusMap, type StocktakingStatus } from "./types";

export const columns: TableColumnList = [
  {
    label: "盘点单名称",
    prop: "name",
    minWidth: 150
  },
  {
    label: "状态",
    prop: "status",
    width: 100,
    cellRenderer: ({ row }) => {
      const status = row.status as StocktakingStatus;
      const config = stocktakingStatusMap[status];
      return (
        <el-tag type={config?.type || "info"} size="small">
          {config?.label || status}
        </el-tag>
      );
    }
  },
  {
    label: "盘点仓库",
    prop: "repo.name",
    width: 120,
    formatter: row => row.repo?.name || "-"
  },
  {
    label: "商品数量",
    prop: "details",
    width: 100,
    formatter: row => row.details?.length || 0
  },
  {
    label: "盘盈数",
    prop: "surplusCount",
    width: 100,
    cellRenderer: ({ row }) => {
      const surplus =
        row.details?.filter(
          (d: { difference?: number }) => (d.difference || 0) > 0
        ).length || 0;
      return <span class="text-green-600">{surplus}</span>;
    }
  },
  {
    label: "盘亏数",
    prop: "lossCount",
    width: 100,
    cellRenderer: ({ row }) => {
      const loss =
        row.details?.filter(
          (d: { difference?: number }) => (d.difference || 0) < 0
        ).length || 0;
      return <span class="text-red-600">{loss}</span>;
    }
  },
  {
    label: "创建人",
    prop: "creatorName",
    width: 100
  },
  {
    label: "开始时间",
    prop: "startedAt",
    width: 160,
    formatter: row =>
      row.startedAt ? dayjs(row.startedAt).format("YYYY-MM-DD HH:mm") : "-"
  },
  {
    label: "完成时间",
    prop: "completedAt",
    width: 160,
    formatter: row =>
      row.completedAt ? dayjs(row.completedAt).format("YYYY-MM-DD HH:mm") : "-"
  },
  {
    label: "备注",
    prop: "remark",
    minWidth: 120,
    showOverflowTooltip: true
  },
  {
    label: "操作",
    fixed: "right",
    slot: "operation",
    width: 240
  }
];

export const detailColumns: TableColumnList = [
  {
    label: "商品名称",
    prop: "tireName",
    minWidth: 150
  },
  {
    label: "商品编码",
    prop: "tireBarcode",
    width: 140
  },
  {
    label: "系统库存",
    prop: "bookCount",
    width: 100
  },
  {
    label: "实际库存",
    prop: "actualCount",
    width: 120,
    slot: "actualCount"
  },
  {
    label: "差异",
    prop: "difference",
    width: 100,
    slot: "difference"
  },
  {
    label: "备注",
    prop: "remark",
    minWidth: 120
  },
  {
    label: "操作",
    fixed: "right",
    width: 100,
    slot: "operation"
  }
];
