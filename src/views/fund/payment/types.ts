/** 付款单状态 */
export type PaymentOrderStatus = "DRAFT" | "APPROVED" | "COMPLETED" | "VOID";

/** 付款方式 */
export type PaymentMethod =
  | "CASH"
  | "BANK_TRANSFER"
  | "WECHAT"
  | "ALIPAY"
  | "CHECK"
  | "OTHER";

/** 付款单明细项 */
export interface PaymentDetailItem {
  id?: number;
  /** 源单据ID */
  sourceOrderId?: string;
  /** 源单据编号 */
  sourceOrderNo?: string;
  /** 源单据类型 */
  sourceOrderType?: string;
  /** 应付金额（分） */
  payableAmount: number;
  /** 本次核销金额（分） */
  writeOffAmount: number;
  /** 备注 */
  remark?: string;
}

/** 付款单 */
export interface PaymentOrder {
  id: number;
  uid: string;
  /** 单据编号 */
  billNo: string;
  /** 供应商ID */
  providerId: string;
  /** 供应商名称 */
  providerName?: string;
  /** 供应商信息 */
  provider?: {
    uid: string;
    name: string;
  };
  /** 结算账户ID */
  paymentId: string;
  /** 结算账户名称 */
  paymentName?: string;
  /** 结算账户信息 */
  payment?: {
    uid: string;
    name: string;
  };
  /** 付款金额（分） */
  amount: number;
  /** 实付金额（分） */
  actualAmount?: number;
  /** 本次核销金额（分） */
  writeOffAmount?: number;
  /** 整单折扣（分） */
  discountAmount?: number;
  /** 本次预付款（分） */
  advanceAmount?: number;
  /** 付款方式 */
  paymentMethod?: PaymentMethod;
  /** 单据状态 */
  status: PaymentOrderStatus;
  /** 付款日期 */
  paymentDate?: string;
  /** 备注 */
  remark?: string;
  /** 明细项 */
  details?: PaymentDetailItem[];
  /** 经办人 */
  operatorId?: string;
  operatorName?: string;
  /** 审核人 */
  approverId?: string;
  approverName?: string;
  /** 审核时间 */
  approvedAt?: string;
  /** 创建时间 */
  createdAt?: string;
  /** 更新时间 */
  updatedAt?: string;
}

/** 创建付款单DTO */
export interface CreatePaymentOrderDto {
  providerId: string;
  paymentId: string;
  amount: number;
  paymentMethod?: PaymentMethod;
  paymentDate?: string;
  remark?: string;
  details?: Omit<PaymentDetailItem, "id">[];
}

/** 更新付款单DTO */
export interface UpdatePaymentOrderDto extends Partial<CreatePaymentOrderDto> {
  uid: string;
}

/** 查询付款单参数 */
export interface PaymentOrderQueryParams {
  index?: number;
  pageSize?: number;
  providerId?: string;
  providerName?: string;
  status?: PaymentOrderStatus;
  paymentMethod?: PaymentMethod;
  startDate?: string;
  endDate?: string;
  billNo?: string;
}

/** 付款方式选项 */
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

/** 付款单状态选项 */
export const PAYMENT_STATUS_OPTIONS: {
  label: string;
  value: PaymentOrderStatus;
  type: "info" | "warning" | "success" | "danger";
}[] = [
  { label: "草稿", value: "DRAFT", type: "info" },
  { label: "已审核", value: "APPROVED", type: "warning" },
  { label: "已完成", value: "COMPLETED", type: "success" },
  { label: "已作废", value: "VOID", type: "danger" }
];

export const paymentStatusMap: Record<
  PaymentOrderStatus,
  { label: string; type: "info" | "warning" | "success" | "danger" }
> = {
  DRAFT: { label: "草稿", type: "info" },
  APPROVED: { label: "已审核", type: "warning" },
  COMPLETED: { label: "已完成", type: "success" },
  VOID: { label: "已作废", type: "danger" }
};

/** 获取付款方式文本 */
export function getPaymentMethodText(method?: PaymentMethod): string {
  const option = PAYMENT_METHOD_OPTIONS.find(o => o.value === method);
  return option?.label || "-";
}
