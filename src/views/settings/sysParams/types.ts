// 系统参数 - 类型定义
export interface SysParams {
  companyName: string;
  enableDate: string;
  currency: string;
  // 小数位数设置
  quantityDecimals: number;
  priceDecimals: number;
  amountDecimals: number;
}

export interface SysParamsFormProps {
  formInline: SysParams;
}
