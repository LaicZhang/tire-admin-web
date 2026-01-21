/** 单位换算项 */
export interface MultiUnitConversion {
  unitUid: string;
  unitName: string;
  ratio: number;
}

/** 多计量单位项 */
export interface MultiUnitItem {
  id: number;
  uid: string;
  name: string;
  baseUnitUid: string;
  baseUnitName: string;
  conversions: MultiUnitConversion[];
  sort: number;
  remark?: string;
}

/** 单位选项 */
export interface UnitOption {
  uid: string;
  name: string;
  symbol: string;
}

/** 表单数据 */
export interface MultiUnitFormData {
  name: string;
  baseUnitUid: string;
  conversions: Array<{ unitUid: string; ratio: number; _uid?: string }>;
  sort: number;
  remark: string;
}

/** 表单Props */
export interface FormProps {
  formInline: MultiUnitFormData;
  unitOptions?: UnitOption[];
  isEdit?: boolean;
}
