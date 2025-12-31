import { ElProgress } from "element-plus";

interface ProviderRankingRow {
  providerName: string;
  orderCount: number;
  totalQuantity: number;
  totalAmount: number | string;
  percentage: number;
}

interface TrendDataRow {
  date: string;
  orderCount: number;
  quantity: number;
  amount: number | string;
}

export function useColumns() {
  const providerRankingColumns: TableColumnList = [
    {
      label: "排名",
      type: "index",
      width: 60
    },
    {
      label: "供应商",
      prop: "providerName"
    },
    {
      label: "订单数",
      prop: "orderCount",
      width: 80
    },
    {
      label: "采购数量",
      prop: "totalQuantity",
      width: 100
    },
    {
      label: "采购金额",
      prop: "totalAmount",
      width: 120,
      cellRenderer: ({ row }: { row: ProviderRankingRow }) => (
        <span>¥{Number(row.totalAmount).toFixed(2)}</span>
      )
    },
    {
      label: "占比",
      width: 150,
      cellRenderer: ({ row }: { row: ProviderRankingRow }) => (
        <ElProgress
          percentage={row.percentage}
          showText={true}
          format={() => row.percentage.toFixed(1) + "%"}
        />
      )
    }
  ];

  const trendDataColumns: TableColumnList = [
    {
      label: "日期",
      prop: "date"
    },
    {
      label: "订单数",
      prop: "orderCount",
      width: 80
    },
    {
      label: "采购数量",
      prop: "quantity",
      width: 100
    },
    {
      label: "采购金额",
      prop: "amount",
      width: 120,
      cellRenderer: ({ row }: { row: TrendDataRow }) => (
        <span>¥{Number(row.amount).toFixed(2)}</span>
      )
    }
  ];

  return {
    providerRankingColumns,
    trendDataColumns
  };
}
