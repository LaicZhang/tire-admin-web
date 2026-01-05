import { ElProgress } from "element-plus";

interface CustomerRankingRow {
  customerName: string;
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
  const customerRankingColumns: TableColumnList = [
    {
      label: "排名",
      type: "index",
      width: 60
    },
    {
      label: "客户",
      prop: "customerName"
    },
    {
      label: "订单数",
      prop: "orderCount",
      width: 80
    },
    {
      label: "销售数量",
      prop: "totalQuantity",
      width: 100
    },
    {
      label: "销售金额",
      prop: "totalAmount",
      width: 120,
      cellRenderer: data => {
        const row = data.row as CustomerRankingRow | undefined;
        return <span>¥{row ? Number(row.totalAmount).toFixed(2) : "-"}</span>;
      }
    },
    {
      label: "占比",
      width: 150,
      cellRenderer: data => {
        const row = data.row as CustomerRankingRow | undefined;
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
      label: "销售数量",
      prop: "quantity",
      width: 100
    },
    {
      label: "销售金额",
      prop: "amount",
      width: 120,
      cellRenderer: data => {
        const row = data.row as TrendDataRow | undefined;
        return <span>¥{row ? Number(row.amount).toFixed(2) : "-"}</span>;
      }
    }
  ];

  return {
    customerRankingColumns,
    trendDataColumns
  };
}
