interface InventoryRow {
  tireName: string;
  repoName?: string;
  quantity?: number;
  lastMoveDate?: string;
  currentQuantity?: number;
  safetyStock?: number;
  suggestPurchase?: number;
}

export function useColumns() {
  const slowMovingColumns: TableColumnList = [
    { label: "商品名称", prop: "tireName" },
    { label: "所在仓库", prop: "repoName" },
    { label: "库存数量", prop: "quantity", width: 100 },
    { label: "最后异动时间", prop: "lastMoveDate" }
  ];

  const stockoutColumns: TableColumnList = [
    { label: "商品名称", prop: "tireName" },
    {
      label: "当前库存",
      prop: "currentQuantity",
      width: 100,
      cellRenderer: data => {
        const row = data.row as InventoryRow | undefined;
        return (
          <span class="text-red-500 font-bold">
            {row?.currentQuantity ?? "-"}
          </span>
        );
      }
    },
    { label: "安全库存", prop: "safetyStock", width: 100 },
    { label: "建议采购", prop: "suggestPurchase" }
  ];

  return { slowMovingColumns, stockoutColumns };
}
