import type { AdvancePaymentListItem } from "@/api/business/advance-payment";
import { calcReceiptStatus, getStatusInfo } from "./types";

function formatCentMoney(value?: string): string {
  if (!value) return "-";
  try {
    const cent = BigInt(value);
    const sign = cent < 0n ? "-" : "";
    const abs = cent < 0n ? -cent : cent;
    const s = abs.toString().padStart(3, "0");
    const integer = s.slice(0, -2);
    const decimal = s.slice(-2);
    return `${sign}${integer}.${decimal}`;
  } catch {
    return "-";
  }
}

export const columns: TableColumnList = [
  {
    type: "selection",
    width: 55,
    align: "center"
  },
  {
    label: "单据编号",
    prop: "billNo",
    minWidth: 180,
    fixed: "left"
  },
  {
    label: "客户",
    prop: "targetName",
    minWidth: 160
  },
  {
    label: "金额(元)",
    prop: "amount",
    minWidth: 120,
    align: "right",
    formatter: (row: AdvancePaymentListItem) => formatCentMoney(row.amount)
  },
  {
    label: "剩余金额(元)",
    prop: "remainingAmount",
    minWidth: 120,
    align: "right",
    formatter: (row: AdvancePaymentListItem) =>
      formatCentMoney(row.remainingAmount)
  },
  {
    label: "状态",
    prop: "remainingAmount",
    minWidth: 90,
    slot: "status"
  },
  {
    label: "备注",
    prop: "remark",
    minWidth: 180,
    showOverflowTooltip: true
  },
  {
    label: "创建时间",
    prop: "createTime",
    minWidth: 160
  },
  {
    label: "操作",
    fixed: "right",
    width: 220,
    slot: "operation"
  }
];

export { calcReceiptStatus, getStatusInfo };
