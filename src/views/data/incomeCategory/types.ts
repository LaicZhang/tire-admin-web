/** 扁平类别项 */
export interface FlatCategoryItem {
  id: number;
  uid: string;
  code: string;
  name: string;
  sort: number;
  remark?: string;
}

/** 表单数据 */
export interface CategoryFormData {
  code: string;
  name: string;
  sort: number;
  remark: string;
}

/** 表单Props */
export interface FormProps {
  formInline: CategoryFormData;
  isEdit?: boolean;
}
