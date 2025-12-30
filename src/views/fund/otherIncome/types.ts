/** 其他收入单状态 */
export type OtherIncomeStatus = "DRAFT" | "APPROVED" | "COMPLETED" | "VOID";

/** 收入类型 */
export type IncomeType =
  | "INTEREST" // 利息收入
  | "RENT" // 租金收入
  | "SCRAP_SALE" // 废品变卖
  | "SUBSIDY" // 政府补贴
  | "COMPENSATION" // 赔偿收入
  | "OTHER"; // 其他收入

/** 其他收入单 */
export interface OtherIncome {
  id: number;
  uid: string;
  /** 单据编号 */
  billNo: string;
  /** 客户ID（可选） */
  customerId?: string;
  customerName?: string;
  customer?: { uid: string; name: string };
  /** 收入类型 */
  incomeType: IncomeType;
  /** 金额（分） */
  amount: number;
  /** 本次收款金额（分） */
  receivedAmount?: number;
  /** 未收款金额（分） */
  unpaidAmount?: number;
  /** 收款账户ID */
  paymentId?: string;
  paymentName?: string;
  payment?: { uid: string; name: string };
  /** 收入日期 */
  incomeDate?: string;
  /** 单据状态 */
  status: OtherIncomeStatus;
  /** 分类 */
  category?: string;
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

/** 创建其他收入单DTO */
export interface CreateOtherIncomeDto {
  customerId?: string;
  incomeType: IncomeType;
  amount: number;
  receivedAmount?: number;
  paymentId?: string;
  incomeDate?: string;
  category?: string;
  remark?: string;
}

/** 查询其他收入单参数 */
export interface OtherIncomeQueryParams {
  index?: number;
  pageSize?: number;
  customerName?: string;
  incomeType?: IncomeType;
  status?: OtherIncomeStatus;
  startDate?: string;
  endDate?: string;
  billNo?: string;
}

/** 收入类型选项 */
export const INCOME_TYPE_OPTIONS: {
  label: string;
  value: IncomeType;
}[] = [
  { label: "利息收入", value: "INTEREST" },
  { label: "租金收入", value: "RENT" },
  { label: "废品变卖", value: "SCRAP_SALE" },
  { label: "政府补贴", value: "SUBSIDY" },
  { label: "赔偿收入", value: "COMPENSATION" },
  { label: "其他收入", value: "OTHER" }
];

/** 状态选项 */
export const OTHER_INCOME_STATUS_OPTIONS: {
  label: string;
  value: OtherIncomeStatus;
  type: "info" | "warning" | "success" | "danger";
}[] = [
  { label: "草稿", value: "DRAFT", type: "info" },
  { label: "已审核", value: "APPROVED", type: "warning" },
  { label: "已完成", value: "COMPLETED", type: "success" },
  { label: "已作废", value: "VOID", type: "danger" }
];

/** 获取收入类型文本 */
export function getIncomeTypeText(type?: IncomeType): string {
  const option = INCOME_TYPE_OPTIONS.find(o => o.value === type);
  return option?.label || "-";
}

/** 获取状态文本和类型 */
export function getStatusInfo(status: OtherIncomeStatus): {
  label: string;
  type: "info" | "warning" | "success" | "danger";
} {
  const option = OTHER_INCOME_STATUS_OPTIONS.find(o => o.value === status);
  return option || { label: "未知", type: "info" };
}
