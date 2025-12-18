export interface FormItemProps {
  id?: string;
  name: string;
  code: string;
  description: string;
  status: number;
}

export interface FormProps {
  formInline: FormItemProps;
}
