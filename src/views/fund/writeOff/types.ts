/** 核销单业务类型 */
export type WriteOffBusinessType =
  | "ADVANCE_RECEIVABLE" // 预收冲应收
  | "ADVANCE_PAYABLE" // 预付冲应付
  | "RECEIVABLE_PAYABLE" // 应收冲应付
  | "RECEIVABLE_TRANSFER" // 应收转应收
  | "PAYABLE_TRANSFER"; // 应付转应付

/** 核销单状态 */
export type WriteOffStatus = "DRAFT" | "APPROVED" | "VOID";

/** 核销单明细项 */
export interface WriteOffDetailItem {
  id?: number;
  /** 源单据ID */
  sourceOrderId?: string;
  /** 源单据编号 */
  sourceOrderNo?: string;
  /** 源单据类型 */
  sourceOrderType?: string;
  /** 原金额（分） */
  originalAmount: number;
  /** 本次核销金额（分） */
  writeOffAmount: number;
  /** 方向：应收或应付 */
  direction?: "RECEIVABLE" | "PAYABLE";
  /** 备注 */
  remark?: string;
}

/** 核销单 */
export interface WriteOffOrder {
  id: number;
  uid: string;
  /** 单据编号 */
  billNo: string;
  /** 业务类型 */
  businessType: WriteOffBusinessType;
  /** 客户ID（转出方） */
  fromCustomerId?: string;
  fromCustomerName?: string;
  fromCustomer?: { uid: string; name: string };
  /** 客户ID（转入方） */
  toCustomerId?: string;
  toCustomerName?: string;
  toCustomer?: { uid: string; name: string };
  /** 供应商ID（转出方） */
  fromProviderId?: string;
  fromProviderName?: string;
  fromProvider?: { uid: string; name: string };
  /** 供应商ID（转入方） */
  toProviderId?: string;
  toProviderName?: string;
  toProvider?: { uid: string; name: string };
  /** 应收金额（分） */
  receivableAmount?: number;
  /** 应付金额（分） */
  payableAmount?: number;
  /** 核销金额（分） */
  writeOffAmount: number;
  /** 单据状态 */
  status: WriteOffStatus;
  /** 是否已审核 */
  isApproved?: boolean;
  /** 核销日期 */
  writeOffDate?: string;
  /** 核销原因 */
  reason?: string;
  /** 备注 */
  remark?: string;
  /** 明细项 */
  details?: WriteOffDetailItem[];
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

/** 创建核销单DTO */
export interface CreateWriteOffDto {
  businessType: WriteOffBusinessType;
  fromCustomerId?: string;
  toCustomerId?: string;
  fromProviderId?: string;
  toProviderId?: string;
  receivableAmount?: number;
  payableAmount?: number;
  writeOffAmount: number;
  writeOffDate?: string;
  reason?: string;
  remark?: string;
  details?: Omit<WriteOffDetailItem, "id">[];
}

/** 查询核销单参数 */
export interface WriteOffQueryParams {
  index?: number;
  pageSize?: number;
  businessType?: WriteOffBusinessType;
  status?: WriteOffStatus;
  isApproved?: string;
  startDate?: string;
  endDate?: string;
  billNo?: string;
}

/** 业务类型选项 */
export const BUSINESS_TYPE_OPTIONS: {
  label: string;
  value: WriteOffBusinessType;
  description: string;
}[] = [
  {
    label: "预收冲应收",
    value: "ADVANCE_RECEIVABLE",
    description: "用预收款核销应收款"
  },
  {
    label: "预付冲应付",
    value: "ADVANCE_PAYABLE",
    description: "用预付款核销应付款"
  },
  {
    label: "应收冲应付",
    value: "RECEIVABLE_PAYABLE",
    description: "应收与应付互抵"
  },
  {
    label: "应收转应收",
    value: "RECEIVABLE_TRANSFER",
    description: "客户间应收款转移"
  },
  {
    label: "应付转应付",
    value: "PAYABLE_TRANSFER",
    description: "供应商间应付款转移"
  }
];

/** 核销单状态选项 */
export const WRITEOFF_STATUS_OPTIONS: {
  label: string;
  value: WriteOffStatus;
  type: "info" | "warning" | "success" | "danger";
}[] = [
  { label: "待审核", value: "DRAFT", type: "warning" },
  { label: "已审核", value: "APPROVED", type: "success" },
  { label: "已作废", value: "VOID", type: "danger" }
];

/** 获取业务类型文本 */
export function getBusinessTypeText(type?: WriteOffBusinessType): string {
  const option = BUSINESS_TYPE_OPTIONS.find(o => o.value === type);
  return option?.label || "-";
}

/** 获取状态文本和类型 */
export function getStatusInfo(status: WriteOffStatus): {
  label: string;
  type: "info" | "warning" | "success" | "danger";
} {
  const option = WRITEOFF_STATUS_OPTIONS.find(o => o.value === status);
  return option || { label: "未知", type: "info" };
}
