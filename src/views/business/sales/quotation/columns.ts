import { fenToYuan } from "@/utils/formatMoney";

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
    formatter: ({ totalAmount }: { totalAmount: number }) =>
      `¥${fenToYuan(totalAmount)}`
  },
  {
    label: "状态",
    prop: "status",
    cellRenderer: ({ row }: { row: { status: string } }) => {
      const map: Record<string, string> = {
        DRAFT: "草稿",
        SENT: "已发送",
        CONFIRMED: "已确认"
      };
      return map[row.status] || row.status;
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
