/**
 * 金额格式化工具函数
 */

/**
 * 格式化金额为千分位格式
 * @param value 金额数值
 * @param decimals 小数位数，默认 2
 * @returns 格式化后的字符串
 * @example formatMoney(12345.6) => "12,345.60"
 */
export function formatMoney(value: number, decimals = 2): string {
  if (isNaN(value) || value === null || value === undefined) {
    return "0.00";
  }
  return value.toLocaleString("zh-CN", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  });
}
