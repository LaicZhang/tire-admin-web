import { ElProgress } from "element-plus";
import { fenToYuan } from "@/utils/formatMoney";

interface ProviderRankingRow {
  providerName: string;
  orderCount: number;
  totalQuantity: number;
  totalAmount: number;
  percentage: number;
}

interface TrendDataRow {
  date: string;
  orderCount: number;
  quantity: number;
  amount: number;
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
      cellRenderer: data => {
        const row = data.row as ProviderRankingRow | undefined;
        return <span>¥{row ? fenToYuan(row.totalAmount) : "-"}</span>;
      }
    },
    {
      label: "占比",
      width: 150,
      cellRenderer: data => {
        const row = data.row as ProviderRankingRow | undefined;
        if (!row) return "-";
        return (
          <ElProgress
            percentage={row.percentage}
            showText={true}
            format={() => row.percentage.toFixed(1) + "%"}
          />
        );
      }
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
      cellRenderer: data => {
        const row = data.row as TrendDataRow | undefined;
        return <span>¥{row ? fenToYuan(row.amount) : "-"}</span>;
      }
    }
  ];

  return {
    providerRankingColumns,
    trendDataColumns
  };
}
