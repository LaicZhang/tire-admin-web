/** 供应商期初余额 */
export interface SupplierBalance {
  id: number;
  uid: string;
  /** 供应商ID */
  supplierId: string;
  /** 供应商名称 */
  supplierName?: string;
  /** 供应商编码 */
  supplierCode?: string;
  /** 联系电话 */
  phone?: string;
  /** 期初应付余额 */
  payableBalance: number;
  /** 期初预付余额 */
  prepaidBalance: number;
  /** 余额日期 */
  balanceDate?: string;
  /** 备注 */
  remark?: string;
  /** 创建时间 */
  createdAt?: string;
  /** 更新时间 */
  updatedAt?: string;
}

/** 供应商期初余额查询参数 */
export interface SupplierBalanceQuery {
  supplierId?: string;
  keyword?: string;
  hasBalance?: boolean;
}

/** 供应商期初余额表单 */
export interface SupplierBalanceForm {
  id?: number;
  uid?: string;
  supplierId: string;
  payableBalance: number;
  prepaidBalance: number;
  balanceDate?: string;
  remark?: string;
}
