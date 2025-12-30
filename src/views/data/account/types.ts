/** 账户表单项属性 */
export interface FormItemProps {
  uid?: string;
  id?: number;
  name: string;
  accountType?: string;
  bankName?: string;
  bankAccount?: string;
  initialBalance?: number;
  balance?: number | string;
  desc?: string;
  companyUid?: string;
}

export interface FormProps {
  formInline: FormItemProps;
  disabled?: boolean;
}
