import { formatMoneyFromFen } from "@/utils/formatMoney";

export const columns: TableColumnList = [
  {
    label: "发票号",
    prop: "invoiceNumber",
    minWidth: 160
  },
  {
    label: "票据角色",
    prop: "invoiceRole",
    minWidth: 100,
    formatter: ({ invoiceRole }: { invoiceRole?: string }) =>
      invoiceRole === "RED" ? "红字票" : "蓝票"
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
    label: "红冲状态",
    prop: "redFlushStatus",
    minWidth: 120,
    formatter: ({ redFlushStatus }: { redFlushStatus?: string }) => {
      if (redFlushStatus === "FULL") return "已全额红冲";
      if (redFlushStatus === "PARTIAL") return "部分红冲";
      return "未红冲";
    }
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
