/** 客户期初余额 */
export interface CustomerBalance {
  id: number;
  uid: string;
  /** 客户ID */
  customerId: string;
  /** 客户名称 */
  customerName?: string;
  /** 客户编码 */
  customerCode?: string;
  /** 联系电话 */
  phone?: string;
  /** 期初应收余额 */
  receivableBalance: number;
  /** 期初预收余额 */
  advanceBalance: number;
  /** 余额日期 */
  balanceDate?: string;
  /** 备注 */
  remark?: string;
  /** 创建时间 */
  createdAt?: string;
  /** 更新时间 */
  updatedAt?: string;
}

/** 客户期初余额查询参数 */
export interface CustomerBalanceQuery {
  customerId?: string;
  keyword?: string;
  hasBalance?: boolean;
}

/** 客户期初余额表单 */
export interface CustomerBalanceForm {
  id?: number;
  uid?: string;
  customerId: string;
  receivableBalance: number;
  advanceBalance: number;
  balanceDate?: string;
  remark?: string;
}
