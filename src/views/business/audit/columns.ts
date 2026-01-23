import { h } from "vue";
import StatusTag from "@/components/StatusTag/index.vue";
import { DOCUMENT_STATUS_MAP } from "@/components/StatusTag/types";

export interface AuditOrder {
  orderNo: string;
  customerName?: string;
  providerName?: string;
  totalAmount: number;
  createdAt: string;
  creatorName: string;
  auditStatus: string;
  uid: string;
}

export const columns = [
  {
    label: "订单号",
    prop: "orderNo",
    minWidth: 150
  },
  {
    label: "客户/供应商",
    minWidth: 120,
    cellRenderer: ({ row }: { row: AuditOrder }) =>
      row.customerName || row.providerName || "-"
  },
  {
    label: "金额",
    minWidth: 100,
    cellRenderer: ({ row }: { row: AuditOrder }) =>
      `¥${(((row as AuditOrder).totalAmount || 0) / 100).toFixed(2)}`
  },
  {
    label: "创建时间",
    minWidth: 160,
    cellRenderer: ({ row }: { row: AuditOrder }) => formatDate(row.createdAt)
  },
  {
    label: "创建人",
    prop: "creatorName",
    minWidth: 100
  },
  {
    label: "状态",
    minWidth: 100,
    cellRenderer: ({ row }: { row: AuditOrder }) =>
      h(StatusTag, {
        status: row.auditStatus,
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
