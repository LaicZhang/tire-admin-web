import { fenToYuan } from "@/utils/formatMoney";
import type { TableColumnRenderer } from "@pureadmin/table";

export const columns: TableColumnList = [
  {
    label: "报价单号",
    prop: "quotationNo"
  },
  {
    label: "客户",
    prop: "customer.name",
    formatter: (data: TableColumnRenderer) => data.row?.customer?.name || "-"
  },
  {
    label: "总金额",
    prop: "totalAmount",
    formatter: (data: TableColumnRenderer) => {
      const explicit = Number(data.row?.totalAmount ?? 0);
      if (Number.isFinite(explicit) && explicit > 0) {
        return `¥${fenToYuan(explicit)}`;
      }
      const derived = Array.isArray(data.row?.details)
        ? data.row.details.reduce(
            (
              sum: number,
              detail: { quantity?: number; quotedPrice?: number }
            ) =>
              sum +
              Number(detail.quantity || 0) * Number(detail.quotedPrice || 0),
            0
          )
        : 0;
      return `¥${fenToYuan(derived)}`;
    }
  },
  {
    label: "状态",
    prop: "status",
    cellRenderer: (data: TableColumnRenderer) => {
      const map: Record<string, string> = {
        DRAFT: "草稿",
        SENT: "已发送",
        ACCEPTED: "已接受",
        REJECTED: "已拒绝",
        EXPIRED: "已过期"
      };
      return map[data.row?.status] || data.row?.status || "-";
    }
  },
  {
    label: "备注",
    prop: "remark"
  },
  {
    label: "操作",
    fixed: "right",
    slot: "operation"
  }
];
