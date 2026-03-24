import { h } from "vue";
import type { TableColumnRenderer } from "@pureadmin/table";
import { MoneyDisplay } from "@/components";
import StatusTag from "@/components/StatusTag/index.vue";
import { DOCUMENT_STATUS_MAP } from "@/components/StatusTag/types";

export interface AuditOrder {
  orderNo: string;
  subjectName?: string;
  customerName?: string;
  providerName?: string;
  totalAmount?: number | string;
  createdAt: string;
  creatorName: string;
  auditStatus: string;
  uid: string;
}

export const columns: TableColumnList = [
  {
    label: "订单号",
    prop: "orderNo",
    minWidth: 150
  },
  {
    label: "关联对象",
    minWidth: 120,
    cellRenderer: ({ row }: TableColumnRenderer) =>
      row?.subjectName || row?.customerName || row?.providerName || "-"
  },
  {
    label: "金额",
    minWidth: 100,
    cellRenderer: ({ row }: TableColumnRenderer) => {
      const rawValue = (row as AuditOrder)?.totalAmount;
      if (rawValue === undefined || rawValue === null || rawValue === "") {
        return "-";
      }
      const value =
        typeof rawValue === "string"
          ? Number(rawValue)
          : (rawValue ?? undefined);
      return h(MoneyDisplay, {
        value,
        unit: "fen"
      });
    }
  },
  {
    label: "创建时间",
    minWidth: 160,
    cellRenderer: ({ row }: TableColumnRenderer) => formatDate(row?.createdAt)
  },
  {
    label: "创建人",
    prop: "creatorName",
    minWidth: 100
  },
  {
    label: "状态",
    minWidth: 100,
    cellRenderer: ({ row }: TableColumnRenderer) =>
      h(StatusTag, {
        status: (row as AuditOrder)?.auditStatus,
        statusMap: DOCUMENT_STATUS_MAP
      })
  },
  {
    label: "操作",
    fixed: "right",
    width: 120,
    slot: "operation"
  }
];

function formatDate(date: string) {
  if (!date) return "-";
  return new Date(date).toLocaleDateString("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit"
  });
}
