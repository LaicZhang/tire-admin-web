/** 供应商表单项属性 */
export interface FormItemProps {
  uid?: string;
  id?: number;
  code?: string;
  name: string;
  contact?: string;
  phone?: string;
  address?: string;
  bankName?: string;
  bankAccount?: string;
  bankInfo?: string;
  desc?: string;
}

export interface FormProps {
  formInline: FormItemProps;
  disabled?: boolean;
}
