/** 单计量单位项 */
export interface SingleUnitItem {
  id: number;
  uid: string;
  name: string;
  symbol: string;
  isDefault: boolean;
  sort: number;
  remark?: string;
}

/** 表单数据 */
export interface SingleUnitFormData {
  name: string;
  symbol: string;
  isDefault: boolean;
  sort: number;
  remark: string;
}

/** 表单Props */
export interface FormProps {
  formInline: SingleUnitFormData;
  isEdit?: boolean;
}
