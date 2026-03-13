import dayjs from "dayjs";
import type { FormRules } from "element-plus";
import { fieldRules } from "@/utils/validation/fieldRules";

type SaleQuotationRow = {
  status?: string;
  details?: Array<{ quantity?: number; quotedPrice?: number }>;
  customerName?: string;
  customer?: { name?: string | null };
  operator?: { name?: string | null };
  totalAmount?: number | string;
  totalPrice?: number | string;
  validUntil?: string;
};

const SALE_QUOTATION_STATUS_LABELS: Record<string, string> = {
  DRAFT: "草稿",
  SENT: "已发送",
  ACCEPTED: "已接受",
  REJECTED: "已拒绝",
  EXPIRED: "已过期",
  draft: "草稿",
  sent: "已发送",
  accepted: "已接受",
  rejected: "已拒绝",
  ordered: "已转订单"
};

function toSafeNumber(value: unknown) {
  const next = Number(value);
  return Number.isFinite(next) ? next : 0;
}

export function getSaleQuotationStatusLabel(status?: string) {
  if (!status) return "-";
  return SALE_QUOTATION_STATUS_LABELS[status] || status;
}

export function getSaleQuotationTotal(row: SaleQuotationRow) {
  if (Array.isArray(row.details) && row.details.length > 0) {
    return row.details.reduce((sum, detail) => {
      return (
        sum + toSafeNumber(detail.quantity) * toSafeNumber(detail.quotedPrice)
      );
    }, 0);
  }
  if (row.totalAmount !== undefined) return toSafeNumber(row.totalAmount);
  return toSafeNumber(row.totalPrice);
}

export const saleQuotationColumns: TableColumnList = [
  {
    label: "报价单号",
    prop: "quotationNo"
  },
  {
    label: "客户",
    prop: "customer.name",
    formatter: ({ customerName, customer }: SaleQuotationRow) =>
      customer?.name ?? customerName ?? "-"
  },
  {
    label: "总价",
    prop: "details",
    formatter: (row: SaleQuotationRow) => String(getSaleQuotationTotal(row))
  },
  {
    label: "状态",
    prop: "status",
    formatter: ({ status }: SaleQuotationRow) =>
      getSaleQuotationStatusLabel(status)
  },
  {
    label: "有效期至",
    prop: "validUntil",
    formatter: ({ validUntil }: SaleQuotationRow) =>
      validUntil ? dayjs(validUntil).format("YYYY-MM-DD") : "-"
  },
  {
    label: "销售员",
    prop: "operator.name",
    formatter: ({ operator }: SaleQuotationRow) => operator?.name ?? "-"
  },
  {
    label: "操作",
    fixed: "right",
    width: 210,
    slot: "operation"
  }
];

export const saleQuotationFormRules: FormRules = {
  customerId: fieldRules.uidSelect({ label: "客户" }),
  validUntil: fieldRules.date({ required: true, label: "有效期" })
};

export const saleQuotationDetailsColumns: TableColumnList = [
  {
    label: "商品",
    prop: "tireId",
    slot: "tireIdSelect"
  },
  {
    label: "数量",
    prop: "quantity",
    slot: "countInput"
  },
  {
    label: "报价单价",
    prop: "quotedPrice",
    cellRenderer: ({ row }) => <el-input-number v-model={row.quotedPrice} />
  },
  {
    label: "备注",
    prop: "remark",
    cellRenderer: ({ row }) => <el-input v-model={row.remark} />
  }
];
