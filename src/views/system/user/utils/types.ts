export interface FormItemProps {
  uid?: string;
  username: string;
  phone: string;
  email?: string;
  password?: string;
  status: string; // '0' | '1' | '2'
}

export interface FormProps {
  formInline: FormItemProps;
}
