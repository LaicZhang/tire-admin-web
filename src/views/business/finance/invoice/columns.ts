import { formatMoneyFromFen } from "@/utils/formatMoney";

export const columns: TableColumnList = [
  {
    label: "发票号",
    prop: "invoiceNumber",
    minWidth: 160
  },
  {
    label: "业务类型",
    prop: "businessType",
    minWidth: 100,
    formatter: ({ businessType }: { businessType: string }) =>
      businessType === "PURCHASE" ? "采购进项" : "销售销项"
  },
  {
    label: "往来单位",
    prop: "partyName",
    minWidth: 160
  },
  {
    label: "对账单号",
    prop: "statementNo",
    minWidth: 160
  },
  {
    label: "价税合计",
    prop: "totalAmount",
    minWidth: 120,
    formatter: ({ totalAmount }: { totalAmount?: number }) =>
      formatMoneyFromFen(Number(totalAmount || 0))
  },
  {
    label: "开票日期",
    prop: "invoiceDate",
    minWidth: 140,
    formatter: ({ invoiceDate }: { invoiceDate?: string }) =>
      invoiceDate?.slice(0, 10) || "-"
  },
  {
    label: "状态",
    prop: "status",
    minWidth: 100,
    slot: "status"
  },
  {
    label: "操作",
    fixed: "right",
    width: 220,
    slot: "operation"
  }
];
