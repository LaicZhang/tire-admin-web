// 格式化金额
const formatAmount = (val: string | number) => {
  const num = Number(val);
  if (isNaN(num)) return "0.00";
  return num.toLocaleString("zh-CN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
};

interface RankRow {
  name: string;
  count: number;
  amount: number | string;
}

export function useColumns() {
  const commonRankColumn = {
    label: "排名",
    width: 70,
    align: "center" as const,
    slot: "rank"
  };

  const salesProductsColumns: TableColumnList = [
    commonRankColumn,
    {
      label: "商品名称",
      prop: "name",
      showOverflowTooltip: true
    },
    {
      label: "销量",
      prop: "count",
      width: 90,
      align: "right"
    },
    {
      label: "销售金额",
      width: 140,
      align: "right",
      cellRenderer: data => {
        const row = data.row as RankRow | undefined;
        return (
          <span class="text-blue-600 font-medium">
            ¥{row ? formatAmount(row.amount) : "-"}
          </span>
        );
      }
    }
  ];

  const purchaseProductsColumns: TableColumnList = [
    commonRankColumn,
    {
      label: "商品名称",
      prop: "name",
      showOverflowTooltip: true
    },
    {
      label: "数量",
      prop: "count",
      width: 90,
      align: "right"
    },
    {
      label: "采购金额",
      width: 140,
      align: "right",
      cellRenderer: data => {
        const row = data.row as RankRow | undefined;
        return (
          <span class="text-green-600 font-medium">
            ¥{row ? formatAmount(row.amount) : "-"}
          </span>
        );
      }
    }
  ];

  const providersColumns: TableColumnList = [
    commonRankColumn,
    {
      label: "供应商名称",
      prop: "name",
      showOverflowTooltip: true
    },
    {
      label: "订单数",
      prop: "count",
      width: 90,
      align: "right"
    },
    {
      label: "采购金额",
      width: 140,
      align: "right",
      cellRenderer: data => {
        const row = data.row as RankRow | undefined;
        return (
          <span class="text-green-600 font-medium">
            ¥{row ? formatAmount(row.amount) : "-"}
          </span>
        );
      }
    }
  ];

  const customersColumns: TableColumnList = [
    commonRankColumn,
    {
      label: "客户名称",
      prop: "name",
      showOverflowTooltip: true
    },
    {
      label: "订单数",
      prop: "count",
      width: 90,
      align: "right"
    },
    {
      label: "交易金额",
      width: 140,
      align: "right",
      cellRenderer: data => {
        const row = data.row as RankRow | undefined;
        return (
          <span class="text-blue-600 font-medium">
            ¥{row ? formatAmount(row.amount) : "-"}
          </span>
        );
      }
    }
  ];

  return {
    salesProductsColumns,
    purchaseProductsColumns,
    providersColumns,
    customersColumns
  };
}
