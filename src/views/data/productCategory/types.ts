/** 树形类别项 */
export interface TreeCategoryItem {
  id: number;
  uid: string;
  name: string;
  parentId: number | null;
  parentUid: string | null;
  sort: number;
  level: number;
  children?: TreeCategoryItem[];
}

/** 表单数据 */
export interface CategoryFormData {
  name: string;
  parentUid: string | null;
  sort: number;
}

/** 表单Props */
export interface FormProps {
  formInline: CategoryFormData;
  treeData?: TreeCategoryItem[];
  isEdit?: boolean;
}
