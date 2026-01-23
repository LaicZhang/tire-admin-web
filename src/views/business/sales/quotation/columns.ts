import { fenToYuan } from "@/utils/formatMoney";
import type { TableColumnRenderer } from "@pureadmin/table";

export const columns: TableColumnList = [
  {
    label: "报价单号",
    prop: "quotationNo"
  },
  {
    label: "客户",
    prop: "customerName"
  },
  {
    label: "总金额",
    prop: "totalAmount",
    formatter: (data: TableColumnRenderer) =>
      `¥${fenToYuan(data.row?.totalAmount ?? 0)}`
  },
  {
    label: "状态",
    prop: "status",
    cellRenderer: (data: TableColumnRenderer) => {
      const map: Record<string, string> = {
        DRAFT: "草稿",
        SENT: "已发送",
        CONFIRMED: "已确认"
      };
      return map[data.row?.status] || data.row?.status || "-";
    }
  },
  {
    label: "备注",
    prop: "desc"
  },
  {
    label: "操作",
    fixed: "right",
    slot: "operation"
  }
];
