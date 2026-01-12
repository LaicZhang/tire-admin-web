/**
 * 金额处理工具函数
 * 统一处理元/分转换，避免 * 100 / 100 魔法数字散落在代码中
 */

/** 金额单位转换常量 */
export const MONEY_UNIT_RATIO = 100;

/**
 * 元转分（前端展示金额 -> 后端存储金额）
 * @param yuan 元为单位的金额
 * @returns 分为单位的金额（整数）
 */
export function yuanToFen(yuan: number): number {
  return Math.round(yuan * MONEY_UNIT_RATIO);
}

/**
 * 分转元（后端存储金额 -> 前端展示金额）
 * @param fen 分为单位的金额
 * @returns 元为单位的金额
 */
export function fenToYuan(fen: number): number {
  return fen / MONEY_UNIT_RATIO;
}

/**
 * 格式化金额显示（分 -> 带两位小数的字符串）
 * @param fen 分为单位的金额
 * @returns 格式化后的金额字符串
 */
export function formatMoney(fen: number): string {
  return fenToYuan(fen).toFixed(2);
}
