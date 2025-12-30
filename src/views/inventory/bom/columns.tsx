import dayjs from "dayjs";
import { bomStatusMap, type BomStatus } from "./types";

export const columns: TableColumnList = [
  {
    label: "BOM编码",
    prop: "code",
    width: 150,
    fixed: "left"
  },
  {
    label: "BOM名称",
    prop: "name",
    minWidth: 150
  },
  {
    label: "状态",
    prop: "status",
    width: 100,
    cellRenderer: ({ row }) => {
      const status = row.status as BomStatus;
      const config = bomStatusMap[status];
      return (
        <el-tag type={config?.type || "info"} size="small">
          {config?.label || status}
        </el-tag>
      );
    }
  },
  {
    label: "成品",
    prop: "targetTireName",
    minWidth: 150
  },
  {
    label: "成品数量",
    prop: "targetQuantity",
    width: 100
  },
  {
    label: "子件数",
    prop: "components",
    width: 100,
    formatter: row => row.components?.length || 0
  },
  {
    label: "预计成本",
    prop: "estimatedMaterialCost",
    width: 120,
    formatter: row =>
      row.estimatedMaterialCost ? row.estimatedMaterialCost.toFixed(2) : "-"
  },
  {
    label: "版本",
    prop: "version",
    width: 80
  },
  {
    label: "创建人",
    prop: "creatorName",
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
    label: "备注",
    prop: "remark",
    minWidth: 120,
    showOverflowTooltip: true
  },
  {
    label: "操作",
    fixed: "right",
    slot: "operation",
    width: 220
  }
];

export const componentColumns: TableColumnList = [
  {
    label: "子件名称",
    prop: "tireName",
    minWidth: 150
  },
  {
    label: "子件编码",
    prop: "tireBarcode",
    width: 140
  },
  {
    label: "用量",
    prop: "quantity",
    width: 100
  },
  {
    label: "预计采购价",
    prop: "estimatedCost",
    width: 120,
    formatter: row => (row.estimatedCost ? row.estimatedCost.toFixed(2) : "-")
  },
  {
    label: "备注",
    prop: "remark",
    minWidth: 100
  }
];
