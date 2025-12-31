/**
 * 盘点项接口
 */
export interface StockTakingItem {
  actualCount?: number;
  bookCount?: number;
  count?: number;
}

/**
 * 计算盘点差异汇总
 */
export function calculateStockTakingSummary(data: StockTakingItem[]) {
  const surplus = data.filter(
    (item: StockTakingItem) =>
      (item.actualCount ?? item.bookCount) > (item.bookCount ?? item.count)
  );
  const waste = data.filter(
    (item: StockTakingItem) =>
      (item.actualCount ?? item.bookCount) < (item.bookCount ?? item.count)
  );
  const unchanged = data.filter(
    (item: StockTakingItem) =>
      (item.actualCount ?? item.bookCount) === (item.bookCount ?? item.count)
  );

  const getBookCount = (item: StockTakingItem) =>
    item.bookCount ?? item.count ?? 0;
  const getActualCount = (item: StockTakingItem) =>
    item.actualCount ?? item.bookCount ?? item.count ?? 0;

  return {
    total: data.length,
    surplusCount: surplus.length,
    surplusQty: surplus.reduce(
      (sum: number, item: StockTakingItem) =>
        sum + (getActualCount(item) - getBookCount(item)),
      0
    ),
    wasteCount: waste.length,
    wasteQty: waste.reduce(
      (sum: number, item: StockTakingItem) =>
        sum + (getBookCount(item) - getActualCount(item)),
      0
    ),
    unchangedCount: unchanged.length
  };
}
