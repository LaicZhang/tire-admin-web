// 编码规则设置 - 类型定义
export interface CodeRule {
  uid: string;
  name: string;
  targetType: "document" | "basic";
  targetTypeName: string;
  targetCode: string;
  targetName: string;
  prefix: string;
  dateFormat: string;
  serialDigits: number;
  serialStart: number;
  resetType: "daily" | "monthly" | "quarterly" | "yearly";
  resetTypeName: string;
  autoFillGap: boolean;
  allowManualEdit: boolean;
  resetOnDateChange: boolean;
  isActive: boolean;
  isDefault: boolean;
  createTime: string;
  updateTime: string;
}

export interface CodeRuleFormProps {
  formInline: Partial<CodeRule>;
}

export interface TargetOption {
  value: string;
  label: string;
  type: "document" | "basic";
}
