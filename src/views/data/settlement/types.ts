/** 结算方式项 */
export interface SettlementItem {
  id: number;
  uid: string;
  code: string;
  name: string;
  isDefault: boolean;
  sort: number;
  remark?: string;
}

/** 表单数据 */
export interface SettlementFormData {
  code: string;
  name: string;
  isDefault: boolean;
  sort: number;
  remark: string;
}

/** 表单Props */
export interface FormProps {
  formInline: SettlementFormData;
  isEdit?: boolean;
}
