/** 转账单状态 */
export type TransferStatus = "DRAFT" | "APPROVED" | "COMPLETED" | "VOID";

/** 转账单 */
export interface Transfer {
  id: number;
  uid: string;
  /** 单据编号 */
  billNo: string;
  /** 转出账户ID */
  fromPaymentId: string;
  fromPaymentName?: string;
  fromPayment?: { uid: string; name: string; balance?: number };
  /** 转入账户ID */
  toPaymentId: string;
  toPaymentName?: string;
  toPayment?: { uid: string; name: string; balance?: number };
  /** 转账金额（分） */
  amount: number;
  /** 手续费（分） */
  fee?: number;
  /** 手续费承担账户ID */
  feePaymentId?: string;
  feePaymentName?: string;
  feePayment?: { uid: string; name: string };
  /** 单据状态 */
  status: TransferStatus;
  /** 转账日期 */
  transferDate?: string;
  /** 备注 */
  remark?: string;
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

/** 创建转账单DTO */
export interface CreateTransferDto {
  fromPaymentId: string;
  toPaymentId: string;
  amount: number;
  fee?: number;
  feePaymentId?: string;
  transferDate?: string;
  remark?: string;
}

/** 查询转账单参数 */
export interface TransferQueryParams {
  index?: number;
  pageSize?: number;
  fromPaymentId?: string;
  toPaymentId?: string;
  status?: TransferStatus;
  startDate?: string;
  endDate?: string;
  billNo?: string;
}

/** 状态选项 */
export const TRANSFER_STATUS_OPTIONS: {
  label: string;
  value: TransferStatus;
  type: "info" | "warning" | "success" | "danger";
}[] = [
  { label: "草稿", value: "DRAFT", type: "info" },
  { label: "已审核", value: "APPROVED", type: "warning" },
  { label: "已完成", value: "COMPLETED", type: "success" },
  { label: "已作废", value: "VOID", type: "danger" }
];

/** 获取状态文本和类型 */
export function getStatusInfo(status: TransferStatus): {
  label: string;
  type: "info" | "warning" | "success" | "danger";
} {
  const option = TRANSFER_STATUS_OPTIONS.find(o => o.value === status);
  return option || { label: "未知", type: "info" };
}
