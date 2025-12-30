import dayjs from "dayjs";
import {
  disassemblyOrderStatusMap,
  type DisassemblyOrderStatus
} from "./types";

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
      const status = row.status as DisassemblyOrderStatus;
      const config = disassemblyOrderStatusMap[status];
      return (
        <el-tag type={config?.type || "info"} size="small">
          {config?.label || status}
        </el-tag>
      );
    }
  },
  {
    label: "组合件名称",
    prop: "sourceTireName",
    minWidth: 150
  },
  {
    label: "拆卸数量",
    prop: "quantity",
    width: 100
  },
  {
    label: "出库仓库",
    prop: "sourceRepoName",
    width: 120
  },
  {
    label: "部件数",
    prop: "components",
    width: 80,
    formatter: row => row.components?.length || 0
  },
  {
    label: "拆卸费用",
    prop: "disassemblyFee",
    width: 100,
    formatter: row =>
      row.disassemblyFee ? row.disassemblyFee.toFixed(2) : "0.00"
  },
  {
    label: "自动分摊",
    prop: "autoAllocateCost",
    width: 100,
    cellRenderer: ({ row }) => (
      <el-tag type={row.autoAllocateCost ? "success" : "info"} size="small">
        {row.autoAllocateCost ? "是" : "否"}
      </el-tag>
    )
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
    label: "部件名称",
    prop: "tireName",
    minWidth: 150
  },
  {
    label: "部件编码",
    prop: "tireBarcode",
    width: 140
  },
  {
    label: "入库仓库",
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
    formatter: row => (row.unitCost ? row.unitCost.toFixed(2) : "-")
  },
  {
    label: "成本金额",
    prop: "totalCost",
    width: 100,
    formatter: row => (row.totalCost ? row.totalCost.toFixed(2) : "-")
  },
  {
    label: "备注",
    prop: "remark",
    minWidth: 100
  }
];
