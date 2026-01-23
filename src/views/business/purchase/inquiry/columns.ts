import type { TableColumnRenderer } from "@pureadmin/table";

export const columns: TableColumnList = [
  {
    label: "询价单号",
    prop: "inquiryNo"
  },
  {
    label: "关联计划",
    prop: "planNo"
  },
  {
    label: "供应商",
    prop: "providerName"
  },
  {
    label: "状态",
    prop: "status",
    cellRenderer: (data: TableColumnRenderer) => {
      const map: Record<string, string> = {
        PENDING: "待回复",
        REPLIED: "已回复",
        CLOSED: "已关闭"
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
