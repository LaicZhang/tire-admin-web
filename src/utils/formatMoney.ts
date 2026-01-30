/**
 * 金额格式化工具函数
 */

/** 金额单位转换常量 */
export const MONEY_UNIT_RATIO = 100;

/**
 * 格式化金额为千分位格式
 * @param value 金额数值（元）
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

/**
 * 分转元（用于展示）
 * @param fen 金额（分）
 * @param decimals 小数位数，默认 2
 * @returns 格式化后的字符串 "x.xx"
 * @example fenToYuan(12345) => "123.45"
 */
export function fenToYuan(
  fen: number | bigint | null | undefined,
  decimals = 2
): string {
  if (fen === null || fen === undefined) return "0.00";
  const yuan = Number(fen) / 100;
  return yuan.toFixed(decimals);
}

/**
 * 分转元（用于计算，返回数字类型）
 * @param fen 金额（分）
 * @returns 元为单位的金额（数字）
 * @example fenToYuanNumber(12345) => 123.45
 */
export function fenToYuanNumber(fen: number): number {
  return fen / MONEY_UNIT_RATIO;
}

/**
 * 分转元（用于展示），空值返回 "-"
 * @param fen 金额（分）
 * @param decimals 小数位数，默认 2
 * @returns 格式化后的字符串 "x.xx" 或 "-"
 */
export function fenToYuanOrDash(
  fen: number | bigint | null | undefined,
  decimals = 2
): string {
  if (fen === null || fen === undefined) return "-";
  return fenToYuan(fen, decimals);
}

/**
 * 元转分（用于提交到后端）
 * @param yuan 金额（元）
 * @returns 金额（分）
 * @example yuanToFen(123.45) => 12345
 */
export function yuanToFen(yuan: number | null | undefined): number {
  if (yuan === null || yuan === undefined) return 0;
  return Math.round(yuan * 100);
}

/**
 * 格式化金额（分→元，带千分位）
 * @param fen 金额（分）
 * @param decimals 小数位数，默认 2
 * @returns 格式化后的字符串 "x,xxx.xx"
 * @example formatMoneyFromFen(1234567) => "12,345.67"
 */
export function formatMoneyFromFen(
  fen: number | bigint | null | undefined,
  decimals = 2
): string {
  return formatMoney(Number(fen ?? 0) / 100, decimals);
}
