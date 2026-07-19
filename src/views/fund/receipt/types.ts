export type ReceiptStatus = "DRAFT" | "APPROVED" | "COMPLETED" | "VOID";

export type PaymentMethod =
  | "CASH"
  | "BANK_TRANSFER"
  | "WECHAT"
  | "ALIPAY"
  | "CHECK"
  | "OTHER";

export interface ReceiptDetailItem {
  id?: number;
  sourceOrderId?: string;
  sourceOrderNo?: string;
  sourceOrderType?: string;
  receivableAmount: number;
  writeOffAmount: number;
  remark?: string;
  invoiceDate?: string;
  deliveryNoteNo?: string;
}

export interface ReceiptOrder {
  id: number;
  uid: string;
  billNo: string;
  customerId: string;
  customerName?: string;
  customer?: {
    uid: string;
    name: string;
  };
  paymentId: string;
  paymentName?: string;
  payment?: {
    uid: string;
    name: string;
  };
  amount: number;
  actualAmount?: number;
  writeOffAmount?: number;
  advanceAmount?: number;
  paymentMethod?: PaymentMethod;
  status: ReceiptStatus;
  receiptDate?: string;
  remark?: string;
  details?: ReceiptDetailItem[];
  operatorId?: string;
  approverId?: string;
  approvedAt?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateReceiptDto {
  customerId: string;
  paymentId: string;
  amount: number;
  paymentMethod?: PaymentMethod;
  receiptDate?: string;
  remark?: string;
  details?: Omit<ReceiptDetailItem, "id">[];
}

export interface ReceiptQueryParams {
  index?: number;
  pageSize?: number;
  customerId?: string;
  customerName?: string;
  status?: ReceiptStatus;
  paymentMethod?: PaymentMethod;
  startDate?: string;
  endDate?: string;
  billNo?: string;
}

export const PAYMENT_METHOD_OPTIONS: {
  label: string;
  value: PaymentMethod;
}[] = [
  { label: "现金", value: "CASH" },
  { label: "银行转账", value: "BANK_TRANSFER" },
  { label: "微信", value: "WECHAT" },
  { label: "支付宝", value: "ALIPAY" },
  { label: "支票", value: "CHECK" },
  { label: "其他", value: "OTHER" }
];

export const RECEIPT_STATUS_OPTIONS: {
  label: string;
  value: ReceiptStatus;
  type: "info" | "warning" | "success" | "danger";
}[] = [
  { label: "草稿", value: "DRAFT", type: "info" },
  { label: "已审核", value: "APPROVED", type: "warning" },
  { label: "已完成", value: "COMPLETED", type: "success" },
  { label: "已作废", value: "VOID", type: "danger" }
];

export const receiptStatusMap: Record<
  ReceiptStatus,
  { label: string; type: "info" | "warning" | "success" | "danger" }
> = {
  DRAFT: { label: "草稿", type: "info" },
  APPROVED: { label: "已审核", type: "warning" },
  COMPLETED: { label: "已完成", type: "success" },
  VOID: { label: "已作废", type: "danger" }
};

export function getPaymentMethodText(method?: PaymentMethod): string {
  const option = PAYMENT_METHOD_OPTIONS.find(item => item.value === method);
  return option?.label || "-";
}
