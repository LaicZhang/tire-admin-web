/** 辅助属性值 */
export interface AuxiliaryAttrValue {
  id: number;
  uid: string;
  name: string;
  sort: number;
}

/** 辅助属性项 */
export interface AuxiliaryAttrItem {
  id: number;
  uid: string;
  name: string;
  values: AuxiliaryAttrValue[];
  sort: number;
  remark?: string;
}

/** 表单数据 */
export interface AuxiliaryAttrFormData {
  name: string;
  values: string[];
  sort: number;
  remark: string;
}

/** 表单Props */
export interface FormProps {
  formInline: AuxiliaryAttrFormData;
  isEdit?: boolean;
}
