export interface FormItemProps {
  id?: number;
  /** 公司名称 */
  name: string;
  /** 联系人 */
  contact: string;
  /** 电话 */
  phone: string;
  /** 地址 */
  address: string;
  /** 状态 1-启用 0-禁用 */
  status: number;
}

export interface FormProps {
  formInline: FormItemProps;
}
