/** 辅助资料项 */
export interface AuxiliaryItem {
  id: number;
  uid: string;
  type: string;
  code: string;
  name: string;
  sort: number;
  remark?: string;
}

/** 表单数据 */
export interface AuxiliaryFormData {
  type: string;
  code: string;
  name: string;
  sort: number;
  remark: string;
}

/** 表单Props */
export interface FormProps {
  formInline: AuxiliaryFormData;
  isEdit?: boolean;
}

/** Tab类型 */
export type AuxiliaryType =
  | "income"
  | "expense"
  | "settlement"
  | "customerLevel"
  | "businessType";

/** Tab配置 */
export interface TabConfig {
  name: AuxiliaryType;
  label: string;
}
