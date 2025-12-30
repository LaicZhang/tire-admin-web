/** 客户表单项属性 */
export interface FormItemProps {
  uid?: string;
  id?: number;
  code?: string;
  name: string;
  contact?: string;
  phone?: string;
  address?: string;
  creditLimit?: number;
  levelId?: number;
  regionId?: number;
  desc?: string;
  tags?: Array<{ id: number; name: string }>;
}

export interface FormProps {
  formInline: FormItemProps;
  disabled?: boolean;
}
