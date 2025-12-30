/** 商品价格资料 */
export interface PriceInfo {
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
  /** 零售价 */
  retailPrice?: number;
  /** 批发价 */
  wholesalePrice?: number;
  /** VIP价 */
  vipPrice?: number;
  /** 会员价 */
  memberPrice?: number;
  /** 最低销售价 */
  minSalePrice?: number;
  /** 最高采购价 */
  maxPurchasePrice?: number;
  /** 最近采购价 */
  lastPurchasePrice?: number;
  /** 最近销售价 */
  lastSalePrice?: number;
  /** 更新时间 */
  updatedAt?: string;
}

/** 价格资料查询参数 */
export interface PriceInfoQuery {
  tireId?: string;
  keyword?: string;
  group?: string;
}

/** 价格资料表单 */
export interface PriceInfoForm {
  tireId: string;
  retailPrice?: number;
  wholesalePrice?: number;
  vipPrice?: number;
  memberPrice?: number;
  minSalePrice?: number;
  maxPurchasePrice?: number;
}

/** 批量编辑价格表单 */
export interface BatchPriceForm {
  tireIds: string[];
  priceType: "retail" | "wholesale" | "vip" | "member";
  adjustType: "fixed" | "percent" | "amount";
  adjustValue: number;
}
