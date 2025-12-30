/** 限价设置 */
export interface PriceLimit {
  id: number;
  uid: string;
  /** 商品ID */
  tireId: string;
  /** 商品名称 */
  tireName?: string;
  /** 商品编码 */
  tireCode?: string;
  /** 分组 */
  group?: string;
  /** 最高采购价 */
  maxPurchasePrice?: number;
  /** 最低销售价 */
  minSalePrice?: number;
  /** 是否启用采购限价 */
  enablePurchaseLimit: boolean;
  /** 是否启用销售限价 */
  enableSaleLimit: boolean;
  /** 更新时间 */
  updatedAt?: string;
}

/** 限价查询参数 */
export interface PriceLimitQuery {
  tireId?: string;
  keyword?: string;
  enablePurchaseLimit?: boolean;
  enableSaleLimit?: boolean;
}

/** 限价表单 */
export interface PriceLimitForm {
  tireId: string;
  maxPurchasePrice?: number;
  minSalePrice?: number;
  enablePurchaseLimit: boolean;
  enableSaleLimit: boolean;
}

/** 系统参数 - 限价控制 */
export interface PriceLimitConfig {
  /** 采购超价控制：warn-提示, block-阻止 */
  purchaseOverPriceAction: "warn" | "block";
  /** 销售低价控制：warn-提示, block-阻止 */
  saleBelowPriceAction: "warn" | "block";
}
