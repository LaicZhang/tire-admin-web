/** 仓库表单项属性 */
export interface FormItemProps {
  uid?: string;
  id?: number;
  code?: string;
  name: string;
  address?: string;
  manager?: string;
  phone?: string;
  desc?: string;
  status?: number;
}

export interface FormProps {
  formInline: FormItemProps;
  disabled?: boolean;
}
