import dayjs from "dayjs";
import type { TableColumnRenderer } from "@pureadmin/table";

function formatInquiryStatus(status?: string) {
  const map: Record<string, string> = {
    DRAFT: "草稿",
    SENT: "已发送",
    REPLIED: "已报价",
    CLOSED: "已关闭"
  };
  return status ? map[status] || status : "-";
}

function formatDetails(
  details?: Array<{
    quantity?: number;
    tire?: { name?: string | null };
    tireId?: string;
  }>
) {
  if (!Array.isArray(details) || details.length === 0) return "-";
  return details
    .map(
      detail =>
        `${detail.tire?.name || detail.tireId || "-"} x ${detail.quantity || 0}`
    )
    .join("；");
}

export const columns: TableColumnList = [
  {
    label: "询价单ID",
    prop: "id",
    width: 100
  },
  {
    label: "供应商",
    prop: "provider.name",
    formatter: ({ provider }) => provider?.name || "-"
  },
  {
    label: "截止日期",
    prop: "deadline",
    formatter: ({ deadline }) =>
      deadline ? dayjs(deadline).format("YYYY-MM-DD") : "-"
  },
  {
    label: "状态",
    prop: "status",
    cellRenderer: (data: TableColumnRenderer) => {
      return formatInquiryStatus(data.row?.status);
    }
  },
  {
    label: "明细",
    prop: "details",
    minWidth: 220,
    formatter: ({ details }) => formatDetails(details)
  },
  {
    label: "备注",
    prop: "remark"
  },
  {
    label: "创建时间",
    prop: "createdAt",
    formatter: ({ createdAt }) =>
      createdAt ? dayjs(createdAt).format("YYYY-MM-DD HH:mm:ss") : "-"
  },
  {
    label: "操作",
    fixed: "right",
    width: 200,
    slot: "operation"
  }
];
