import type { TableColumnRenderer } from "@pureadmin/table";

export const slowMovingColumns: TableColumnList = [
  {
    label: "商品名称",
    prop: "tireName"
  },
  {
    label: "所在仓库",
    prop: "repoName"
  },
  {
    label: "库存数量",
    prop: "quantity",
    width: 100
  },
  {
    label: "最后异动时间",
    prop: "lastMoveDate"
  }
];

export const stockoutColumns: TableColumnList = [
  {
    label: "商品名称",
    prop: "tireName"
  },
  {
    label: "当前库存",
    prop: "currentQuantity",
    width: 100,
    cellRenderer: (data: TableColumnRenderer) => (
      <span class="text-red-500 font-bold">{data.row?.currentQuantity}</span>
    )
  },
  {
    label: "安全库存",
    prop: "safetyStock",
    width: 100
  },
  {
    label: "建议采购",
    prop: "suggestPurchase"
  }
];
