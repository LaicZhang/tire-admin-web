/**
 * BigInt JSON 金额（T3-ADM-002）。
 * 后端把 BigInt 序列化成字符串；比较与展示前必须数值化。
 * null / undefined / "" 按 0 参与比较（与 `value || 0` 一致），非法值也视为 0。
 */

export type MoneyAmount = string | number;

export function toMoneyNumber(value: unknown): number | null {
  if (value === null || value === undefined || value === "") return null;
  const num = typeof value === "number" ? value : Number(value);
  return Number.isFinite(num) ? num : null;
}

/** 比较用：空值当 0，非法值当 0。 */
export function coerceMoneyAmount(value: unknown): number {
  return toMoneyNumber(value) ?? 0;
}

export function isAmountLess(left: unknown, right: unknown): boolean {
  return coerceMoneyAmount(left) < coerceMoneyAmount(right);
}

/** 已审核且已付/已收小于应收/应付时，收款或付款按钮可见。 */
export function canCollectApprovedOrder(row: {
  isApproved?: boolean;
  paidAmount?: unknown;
  total?: unknown;
}): boolean {
  return Boolean(row.isApproved) && isAmountLess(row.paidAmount, row.total);
}

const ORDER_MONEY_KEYS = ["total", "showTotal", "paidAmount"] as const;
const DETAIL_MONEY_KEYS = ["unitPrice", "total", "discountAmount"] as const;

function assignMoney(target: Record<string, unknown>, key: string) {
  if (!Object.prototype.hasOwnProperty.call(target, key)) return;
  const next = toMoneyNumber(target[key]);
  if (next !== null) target[key] = next;
}

/** 把单据头与明细上的金额字段从字符串归一成 number。分页 total 不在这里处理。 */
export function normalizeOrderMoney<T>(order: T): T {
  if (!order || typeof order !== "object") return order;
  const next = { ...(order as Record<string, unknown>) };
  for (const key of ORDER_MONEY_KEYS) assignMoney(next, key);
  const details = next.details;
  if (Array.isArray(details)) {
    next.details = details.map(detail => {
      if (!detail || typeof detail !== "object") return detail;
      const row = { ...(detail as Record<string, unknown>) };
      for (const key of DETAIL_MONEY_KEYS) assignMoney(row, key);
      return row;
    });
  }
  return next as T;
}

export function normalizeOrderListResult<
  TResult extends {
    code: number;
    data?: { list?: unknown[] } | null;
  }
>(result: TResult): TResult {
  if (result?.code !== 200 || !result.data?.list) return result;
  return {
    ...result,
    data: {
      ...result.data,
      list: result.data.list.map(item => normalizeOrderMoney(item))
    }
  } as TResult;
}

export function normalizeOrderResult<
  TResult extends { code: number; data?: unknown }
>(result: TResult): TResult {
  if (result?.code !== 200 || result.data == null) return result;
  return {
    ...result,
    data: normalizeOrderMoney(result.data)
  } as TResult;
}
