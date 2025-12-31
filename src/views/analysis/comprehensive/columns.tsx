import { ElTag } from "element-plus";

function formatMoney(value: number) {
  return Number((value / 100).toFixed(2));
}

interface ClaimLossRow {
  reason: string;
  count: number;
  amount: number;
}

interface SlowMovingRow {
  name: string;
  stock: number;
  lastSaleDate?: string;
  daysWithoutSale: number;
}

interface ExpiryRow {
  range: string;
  count: number;
  percentage: number;
}

interface StockoutRow {
  name: string;
  currentStock: number;
  minStock: number;
}

export function useColumns() {
  const claimLossColumns: TableColumnList = [
    { label: "理赔原因", prop: "reason" },
    { label: "次数", prop: "count" },
    {
      label: "金额",
      cellRenderer: ({ row }: { row: ClaimLossRow }) => (
        <span>¥{formatMoney(row.amount)}</span>
      )
    }
  ];

  const slowMovingColumns: TableColumnList = [
    { label: "商品名称", prop: "name", minWidth: 150 },
    { label: "当前库存", prop: "stock", width: 100 },
    { label: "最后销售日期", prop: "lastSaleDate", width: 150 },
    {
      label: "滞销天数",
      prop: "daysWithoutSale",
      width: 100,
      cellRenderer: ({ row }: { row: SlowMovingRow }) => (
        <ElTag type={row.daysWithoutSale > 90 ? "danger" : "warning"}>
          {row.daysWithoutSale} 天
        </ElTag>
      )
    }
  ];

  const expiryColumns: TableColumnList = [
    { label: "保质期范围", prop: "range" },
    { label: "商品数量", prop: "count", width: 120 },
    {
      label: "占比",
      width: 120,
      cellRenderer: ({ row }: { row: ExpiryRow }) => (
        <span>{row.percentage.toFixed(1)}%</span>
      )
    }
  ];

  const stockoutColumns: TableColumnList = [
    { label: "商品名称", prop: "name", minWidth: 150 },
    {
      label: "当前库存",
      prop: "currentStock",
      width: 100,
      cellRenderer: ({ row }: { row: StockoutRow }) => (
        <ElTag type="danger">{row.currentStock}</ElTag>
      )
    },
    { label: "安全库存", prop: "minStock", width: 100 }
  ];

  return {
    claimLossColumns,
    slowMovingColumns,
    expiryColumns,
    stockoutColumns
  };
}
