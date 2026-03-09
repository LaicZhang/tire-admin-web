import { ORDER_TYPE } from "@/utils/const";

export type StockTakingOrderType = ORDER_TYPE.surplus | ORDER_TYPE.waste;

export interface StockTakingOrderDraftItem {
  repoId: string;
  tireId: string;
  tireName?: string;
  count: number;
  desc?: string;
}

const STORAGE_KEY_MAP: Record<StockTakingOrderType, string> = {
  [ORDER_TYPE.surplus]: "stockTakingSurplus",
  [ORDER_TYPE.waste]: "stockTakingWaste"
};

const ROUTE_MAP: Record<StockTakingOrderType, string> = {
  [ORDER_TYPE.surplus]: "/business/surplus",
  [ORDER_TYPE.waste]: "/business/waste"
};

function isDraftItem(value: unknown): value is StockTakingOrderDraftItem {
  if (!value || typeof value !== "object") return false;
  const record = value as Record<string, unknown>;
  return (
    typeof record.repoId === "string" &&
    record.repoId.length > 0 &&
    typeof record.tireId === "string" &&
    record.tireId.length > 0 &&
    Number.isInteger(record.count) &&
    Number(record.count) > 0
  );
}

export function getStockTakingStorageKey(type: StockTakingOrderType) {
  return STORAGE_KEY_MAP[type];
}

export function getStockTakingRoute(type: StockTakingOrderType) {
  return ROUTE_MAP[type];
}

export function readStockTakingDraft(
  type: StockTakingOrderType,
  storage: Pick<Storage, "getItem"> = sessionStorage
) {
  const raw = storage.getItem(getStockTakingStorageKey(type));
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return null;

    const items = parsed.filter(isDraftItem);
    return items.length === parsed.length && items.length > 0 ? items : null;
  } catch {
    return null;
  }
}

export function createStockTakingOrderFormData(
  items: StockTakingOrderDraftItem[]
) {
  return {
    count: items.reduce((sum, item) => sum + item.count, 0),
    total: 0,
    showTotal: 0,
    paidAmount: 0,
    details: items.map(item => ({
      repoId: item.repoId,
      tireId: item.tireId,
      count: item.count,
      desc: item.desc
    }))
  };
}
