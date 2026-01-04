export interface MoneyDisplayProps {
  /** 金额值 */
  value: number | null | undefined;
  /** 输入单位：分或元 */
  unit?: "fen" | "yuan";
  /** 是否显示货币符号 */
  showSymbol?: boolean;
  /** 小数位数 */
  precision?: number;
  /** 货币符号 */
  symbol?: string;
  /** 空值显示文本 */
  emptyText?: string;
}
