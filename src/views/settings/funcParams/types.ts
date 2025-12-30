// 功能参数 - 类型定义
export interface FuncParams {
  // 审核相关
  enableAudit: boolean;
  // 税金相关
  enableTax: boolean;
  defaultTaxRate: number;
  enableAutoTaxPrice: boolean;
  // 打印相关
  enableAdvancedPrint: boolean;
  // 商品属性
  enableAuxAttribute: boolean;
  enableShelfLife: boolean;
  enableBatch: boolean;
  enableSerialNumber: boolean;
  // 库存相关
  allowNegativeStock: boolean;
  // 结算相关
  enableAutoFillSettlement: boolean;
  // 单据日期
  disableSalesDateEdit: boolean;
  // 订单超量
  allowExceedSalesOrder: boolean;
  allowExceedPurchaseOrder: boolean;
  // 保质期提示
  enableShelfLifeAlert: boolean;
  // 限价
  allowBelowMinPrice: boolean;
  allowAboveMaxPrice: boolean;
}

export interface FuncParamsFormProps {
  formInline: FuncParams;
}
