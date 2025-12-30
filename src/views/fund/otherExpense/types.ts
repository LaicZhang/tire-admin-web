/** 其他支出单状态 */
export type OtherExpenseStatus = "DRAFT" | "APPROVED" | "COMPLETED" | "VOID";

/** 支出类型 */
export type ExpenseType =
  | "FREIGHT" // 运费
  | "OFFICE" // 办公费
  | "SALARY" // 工资
  | "RENT" // 房租
  | "UTILITIES" // 水电费
  | "REPAIR" // 维修费
  | "INSURANCE" // 保险费
  | "TAX" // 税费
  | "OTHER"; // 其他支出

/** 其他支出单 */
export interface OtherExpense {
  id: number;
  uid: string;
  /** 单据编号 */
  billNo: string;
  /** 供应商ID（可选） */
  providerId?: string;
  providerName?: string;
  provider?: { uid: string; name: string };
  /** 支出类型 */
  expenseType: ExpenseType;
  /** 金额（分） */
  amount: number;
  /** 本次付款金额（分） */
  paidAmount?: number;
  /** 未付款金额（分） */
  unpaidAmount?: number;
  /** 付款账户ID */
  paymentId?: string;
  paymentName?: string;
  payment?: { uid: string; name: string };
  /** 支出日期 */
  expenseDate?: string;
  /** 单据状态 */
  status: OtherExpenseStatus;
  /** 分类 */
  category?: string;
  /** 关联单据ID */
  relatedOrderId?: string;
  /** 关联单据编号 */
  relatedOrderNo?: string;
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

/** 创建其他支出单DTO */
export interface CreateOtherExpenseDto {
  providerId?: string;
  expenseType: ExpenseType;
  amount: number;
  paidAmount?: number;
  paymentId?: string;
  expenseDate?: string;
  category?: string;
  relatedOrderId?: string;
  remark?: string;
}

/** 查询其他支出单参数 */
export interface OtherExpenseQueryParams {
  index?: number;
  pageSize?: number;
  providerName?: string;
  expenseType?: ExpenseType;
  status?: OtherExpenseStatus;
  startDate?: string;
  endDate?: string;
  billNo?: string;
}

/** 支出类型选项 */
export const EXPENSE_TYPE_OPTIONS: {
  label: string;
  value: ExpenseType;
}[] = [
  { label: "运费", value: "FREIGHT" },
  { label: "办公费", value: "OFFICE" },
  { label: "工资", value: "SALARY" },
  { label: "房租", value: "RENT" },
  { label: "水电费", value: "UTILITIES" },
  { label: "维修费", value: "REPAIR" },
  { label: "保险费", value: "INSURANCE" },
  { label: "税费", value: "TAX" },
  { label: "其他支出", value: "OTHER" }
];

/** 状态选项 */
export const OTHER_EXPENSE_STATUS_OPTIONS: {
  label: string;
  value: OtherExpenseStatus;
  type: "info" | "warning" | "success" | "danger";
}[] = [
  { label: "草稿", value: "DRAFT", type: "info" },
  { label: "已审核", value: "APPROVED", type: "warning" },
  { label: "已完成", value: "COMPLETED", type: "success" },
  { label: "已作废", value: "VOID", type: "danger" }
];

/** 获取支出类型文本 */
export function getExpenseTypeText(type?: ExpenseType): string {
  const option = EXPENSE_TYPE_OPTIONS.find(o => o.value === type);
  return option?.label || "-";
}

/** 获取状态文本和类型 */
export function getStatusInfo(status: OtherExpenseStatus): {
  label: string;
  type: "info" | "warning" | "success" | "danger";
} {
  const option = OTHER_EXPENSE_STATUS_OPTIONS.find(o => o.value === status);
  return option || { label: "未知", type: "info" };
}
