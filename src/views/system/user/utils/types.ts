export interface FormItemProps {
  uid?: string;
  username: string;
  phone: string;
  email?: string;
  password?: string;
  status: string | boolean | number; // enable/disable
  deleteAt?: string | null;
}

export interface FormProps {
  formInline: FormItemProps;
}
