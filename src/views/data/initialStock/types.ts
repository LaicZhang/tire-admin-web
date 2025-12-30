/** 期初库存 */
export interface InitialStock {
  id: number;
  uid: string;
  /** 商品ID */
  tireId: string;
  /** 商品名称 */
  tireName?: string;
  /** 商品编码 */
  tireCode?: string;
  /** 仓库ID */
  repoId: string;
  /** 仓库名称 */
  repoName?: string;
  /** 期初数量 */
  quantity: number;
  /** 期初成本单价 */
  costPrice: number;
  /** 期初成本金额 */
  costAmount: number;
  /** 批次号 */
  batchNo?: string;
  /** 备注 */
  remark?: string;
  /** 创建时间 */
  createdAt?: string;
  /** 更新时间 */
  updatedAt?: string;
}

/** 期初库存查询参数 */
export interface InitialStockQuery {
  tireId?: string;
  repoId?: string;
  keyword?: string;
}

/** 期初库存表单 */
export interface InitialStockForm {
  id?: number;
  uid?: string;
  tireId: string;
  repoId: string;
  quantity: number;
  costPrice: number;
  batchNo?: string;
  remark?: string;
}

/** 期初库存明细行 */
export interface InitialStockItem {
  repoId: string;
  repoName?: string;
  quantity: number;
  costPrice: number;
  batchNo?: string;
}
