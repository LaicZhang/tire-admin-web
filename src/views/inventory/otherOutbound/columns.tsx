import dayjs from "dayjs";
import {
  otherOutboundStatusMap,
  otherOutboundTypeMap,
  type OtherOutboundStatus,
  type OtherOutboundType
} from "./types";

export const columns: TableColumnList = [
  {
    label: "单据编号",
    prop: "orderNumber",
    width: 180,
    fixed: "left"
  },
  {
    label: "业务类型",
    prop: "type",
    width: 100,
    cellRenderer: ({ row }) => {
      const type = row.type as OtherOutboundType;
      const config = otherOutboundTypeMap[type];
      return (
        <el-tag type={config?.type || "info"} size="small">
          {config?.label || type}
        </el-tag>
      );
    }
  },
  {
    label: "状态",
    prop: "status",
    width: 100,
    cellRenderer: ({ row }) => {
      const status = row.status as OtherOutboundStatus;
      const config = otherOutboundStatusMap[status];
      return (
        <el-tag type={config?.type || "info"} size="small">
          {config?.label || status}
        </el-tag>
      );
    }
  },
  {
    label: "客户",
    prop: "customerName",
    minWidth: 120,
    formatter: row => row.customerName || "-"
  },
  {
    label: "商品数量",
    prop: "totalQuantity",
    width: 100
  },
  {
    label: "出库金额",
    prop: "totalAmount",
    width: 120,
    formatter: row => (row.totalAmount ? row.totalAmount.toFixed(2) : "0.00")
  },
  {
    label: "操作人",
    prop: "operatorName",
    width: 100
  },
  {
    label: "单据日期",
    prop: "orderDate",
    width: 120,
    formatter: row =>
      row.orderDate ? dayjs(row.orderDate).format("YYYY-MM-DD") : "-"
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
    width: 200
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
    width: 120,
    formatter: row => (row.unitCost ? row.unitCost.toFixed(2) : "-")
  },
  {
    label: "成本金额",
    prop: "totalCost",
    width: 120,
    formatter: row => (row.totalCost ? row.totalCost.toFixed(2) : "-")
  },
  {
    label: "备注",
    prop: "remark",
    minWidth: 100
  }
];
