/** 职员表单项属性 */
export interface FormItemProps {
  uid?: string;
  id?: number;
  code?: string;
  name: string;
  nickname?: string;
  department?: string;
  position?: string;
  phone?: string;
  email?: string;
  status?: number;
  desc?: string;
  jobs?: unknown[];
}

export interface FormProps {
  formInline: FormItemProps;
  disabled?: boolean;
}
