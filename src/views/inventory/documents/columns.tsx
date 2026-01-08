import dayjs from "dayjs";
import {
  documentTypeMap,
  documentStatusMap,
  type DocumentType,
  type DocumentStatus
} from "./types";
import { fenToYuan } from "@/utils/formatMoney";

export const columns: TableColumnList = [
  {
    type: "selection",
    width: 50,
    fixed: "left"
  },
  {
    label: "单据编号",
    prop: "orderNumber",
    width: 180,
    fixed: "left",
    cellRenderer: ({ row }) => (
      <span class="text-primary cursor-pointer font-medium">
        {row.orderNumber}
      </span>
    )
  },
  {
    label: "单据类型",
    prop: "type",
    width: 120,
    cellRenderer: ({ row }) => {
      const type = row.type as DocumentType;
      const config = documentTypeMap[type];
      return (
        <el-tag
          style={{ backgroundColor: config?.color, color: "#fff" }}
          size="small"
        >
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
      const status = row.status as DocumentStatus;
      const config = documentStatusMap[status];
      return (
        <el-tag type={config?.type || "info"} size="small">
          {config?.label || status}
        </el-tag>
      );
    }
  },
  {
    label: "数量",
    prop: "totalQuantity",
    width: 80,
    formatter: row => row.totalQuantity || "-"
  },
  {
    label: "金额",
    prop: "totalAmount",
    width: 120,
    formatter: row => (row.totalAmount ? `¥${fenToYuan(row.totalAmount)}` : "-")
  },
  {
    label: "操作人",
    prop: "operatorName",
    width: 100
  },
  {
    label: "审核人",
    prop: "auditorName",
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
    minWidth: 150,
    showOverflowTooltip: true
  },
  {
    label: "操作",
    fixed: "right",
    slot: "operation",
    width: 180
  }
];
