import dayjs from "dayjs";
import {
  otherInboundStatusMap,
  otherInboundTypeMap,
  type OtherInboundStatus,
  type OtherInboundType
} from "./types";
import { fenToYuan } from "@/utils/formatMoney";

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
      const type = row.type as OtherInboundType;
      const config = otherInboundTypeMap[type];
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
      const status = row.status as OtherInboundStatus;
      const config = otherInboundStatusMap[status];
      return (
        <el-tag type={config?.type || "info"} size="small">
          {config?.label || status}
        </el-tag>
      );
    }
  },
  {
    label: "供应商",
    prop: "providerName",
    minWidth: 120,
    formatter: row => row.providerName || "-"
  },
  {
    label: "商品数量",
    prop: "totalQuantity",
    width: 100
  },
  {
    label: "入库金额",
    prop: "totalAmount",
    width: 120,
    formatter: row =>
      row.totalAmount ? `¥${fenToYuan(row.totalAmount)}` : "¥0.00"
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
    width: 120,
    formatter: row => (row.unitCost ? `¥${fenToYuan(row.unitCost)}` : "-")
  },
  {
    label: "成本金额",
    prop: "totalCost",
    width: 120,
    formatter: row => (row.totalCost ? `¥${fenToYuan(row.totalCost)}` : "-")
  },
  {
    label: "备注",
    prop: "remark",
    minWidth: 100
  }
];
