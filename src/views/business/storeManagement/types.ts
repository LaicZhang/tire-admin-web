export interface FormItemProps {
  uid?: string;
  name: string;
  address?: string;
  defaultRepositoryId?: string;
  desc?: string;
  status: boolean;
}

export interface FormProps {
  formInline: FormItemProps;
  refreshCallback?: () => void;
}
