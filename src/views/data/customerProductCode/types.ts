/** 客户商品编码 */
export interface CustomerProductCode {
  id: number;
  uid: string;
  /** 客户ID */
  customerId: string;
  /** 客户名称 */
  customerName?: string;
  /** 商品ID */
  tireId: string;
  /** 商品名称 */
  tireName?: string;
  /** 客户商品编码 */
  customerCode: string;
  /** 客户商品名称 */
  customerProductName?: string;
  /** 备注 */
  remark?: string;
  /** 创建时间 */
  createdAt?: string;
  /** 更新时间 */
  updatedAt?: string;
}

/** 客户商品编码查询参数 */
export interface CustomerProductCodeQuery {
  customerId?: string;
  tireId?: string;
  customerCode?: string;
  keyword?: string;
}

/** 客户商品编码表单 */
export interface CustomerProductCodeForm {
  id?: number;
  uid?: string;
  customerId: string;
  tireId: string;
  customerCode: string;
  customerProductName?: string;
  remark?: string;
}
