import dayjs from "dayjs";
import { assemblyOrderStatusMap, type AssemblyOrderStatus } from "./types";
import { fenToYuan } from "@/utils/formatMoney";

export const columns: TableColumnList = [
  {
    label: "单据编号",
    prop: "orderNumber",
    width: 180,
    fixed: "left"
  },
  {
    label: "状态",
    prop: "status",
    width: 100,
    cellRenderer: ({ row }) => {
      const status = row.status as AssemblyOrderStatus;
      const config = assemblyOrderStatusMap[status];
      return (
        <el-tag type={config?.type || "info"} size="small">
          {config?.label || status}
        </el-tag>
      );
    }
  },
  {
    label: "成品名称",
    prop: "targetTireName",
    minWidth: 150
  },
  {
    label: "组装数量",
    prop: "quantity",
    width: 100
  },
  {
    label: "入库仓库",
    prop: "targetRepoName",
    width: 120
  },
  {
    label: "子件数",
    prop: "components",
    width: 80,
    formatter: row => row.components?.length || 0
  },
  {
    label: "组装费用",
    prop: "assemblyFee",
    width: 100,
    formatter: row =>
      row.assemblyFee ? `¥${fenToYuan(row.assemblyFee)}` : "¥0.00"
  },
  {
    label: "总成本",
    prop: "totalCost",
    width: 120,
    formatter: row => (row.totalCost ? `¥${fenToYuan(row.totalCost)}` : "-")
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
    label: "备注",
    prop: "remark",
    minWidth: 100,
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
    label: "出库仓库",
    prop: "repoName",
    width: 120
  },
  {
    label: "数量",
    prop: "quantity",
    width: 100
  },
  {
    label: "单位成本",
    prop: "unitCost",
    width: 100,
    formatter: row => (row.unitCost ? `¥${fenToYuan(row.unitCost)}` : "-")
  },
  {
    label: "成本金额",
    prop: "totalCost",
    width: 100,
    formatter: row => (row.totalCost ? `¥${fenToYuan(row.totalCost)}` : "-")
  },
  {
    label: "备注",
    prop: "remark",
    minWidth: 100
  }
];
