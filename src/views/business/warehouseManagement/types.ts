export interface FormItemProps {
  uid?: string;
  name: string;
  address?: string;
  managerId?: string;
  desc?: string;
  status: boolean;
}

export interface FormProps {
  formInline: FormItemProps;
  refreshCallback?: () => void;
}
