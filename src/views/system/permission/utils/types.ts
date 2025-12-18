export interface FormItemProps {
  /** 权限名称 */
  name: string;
  /** 权限标识 */
  code: string;
  /** 描述 */
  description: string;
}

export interface FormProps {
  formInline: FormItemProps;
}
