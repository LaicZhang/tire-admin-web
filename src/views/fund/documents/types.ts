/** 单据类型 */
export type DocumentType =
  | "RECEIPT" // 收款单
  | "PAYMENT" // 付款单
  | "WRITE_OFF" // 核销单
  | "OTHER_INCOME" // 其他收入单
  | "OTHER_EXPENSE" // 其他支出单
  | "TRANSFER"; // 转账单

export type ElTagType = "primary" | "success" | "warning" | "info" | "danger";

/** 单据状态 */
export type DocumentStatus = "DRAFT" | "APPROVED" | "COMPLETED" | "VOID";

/** 资金单据统一接口 */
export interface FundDocument {
  id: number;
  uid: string;
  /** 单据编号 */
  billNo: string;
  /** 单据类型 */
  documentType: DocumentType;
  /** 往来单位名称 */
  targetName?: string;
  /** 金额（分） */
  amount: number;
  /** 收支方向 */
  direction: "IN" | "OUT" | "TRANSFER";
  /** 账户名称 */
  paymentName?: string;
  /** 单据状态 */
  status: DocumentStatus;
  /** 单据日期 */
  documentDate?: string;
  /** 备注 */
  remark?: string;
  /** 经办人 */
  operatorName?: string;
  /** 创建时间 */
  createdAt?: string;
}

/** 查询资金单据参数 */
export interface FundDocumentQueryParams {
  index?: number;
  pageSize?: number;
  documentType?: DocumentType;
  targetName?: string;
  status?: DocumentStatus;
  direction?: "IN" | "OUT" | "TRANSFER";
  startDate?: string;
  endDate?: string;
  billNo?: string;
}

/** 单据类型选项 */
export const DOCUMENT_TYPE_OPTIONS: {
  label: string;
  value: DocumentType;
  color: ElTagType;
}[] = [
  { label: "收款单", value: "RECEIPT", color: "success" },
  { label: "付款单", value: "PAYMENT", color: "danger" },
  { label: "核销单", value: "WRITE_OFF", color: "warning" },
  { label: "其他收入单", value: "OTHER_INCOME", color: "success" },
  { label: "其他支出单", value: "OTHER_EXPENSE", color: "danger" },
  { label: "转账单", value: "TRANSFER", color: "info" }
];

/** 状态选项 */
export const DOCUMENT_STATUS_OPTIONS: {
  label: string;
  value: DocumentStatus;
  type: "info" | "warning" | "success" | "danger";
}[] = [
  { label: "草稿", value: "DRAFT", type: "info" },
  { label: "已审核", value: "APPROVED", type: "warning" },
  { label: "已完成", value: "COMPLETED", type: "success" },
  { label: "已作废", value: "VOID", type: "danger" }
];

/** 方向选项 */
export const DIRECTION_OPTIONS: {
  label: string;
  value: "IN" | "OUT" | "TRANSFER";
}[] = [
  { label: "收入", value: "IN" },
  { label: "支出", value: "OUT" },
  { label: "转账", value: "TRANSFER" }
];

/** 获取单据类型信息 */
export function getDocumentTypeInfo(type?: DocumentType): {
  label: string;
  color: ElTagType;
} {
  const option = DOCUMENT_TYPE_OPTIONS.find(o => o.value === type);
  return option || { label: "未知", color: "info" };
}

/** 获取状态文本和类型 */
export function getStatusInfo(status: DocumentStatus): {
  label: string;
  type: "info" | "warning" | "success" | "danger";
} {
  const option = DOCUMENT_STATUS_OPTIONS.find(o => o.value === status);
  return option || { label: "未知", type: "info" };
}
