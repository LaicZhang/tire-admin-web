/** 商品表单项属性 */
export interface FormItemProps {
  uid?: string;
  id?: number;
  name: string;
  group?: string;
  brand?: string;
  pattern?: string;
  format?: string;
  unit?: string;
  purchasePrice?: number;
  salePrice?: number;
  minStock?: number;
  maxStock?: number;
  enableSerialNumber?: boolean;
  enableBatch?: boolean;
  desc?: string;
}

export interface FormProps {
  formInline: FormItemProps;
  disabled?: boolean;
}
