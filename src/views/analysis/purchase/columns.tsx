interface ProviderRow {
  rank: number;
  name: string;
  count: number;
  amount: string | number;
}

interface ProductRow {
  rank: number;
  name: string;
  quantity: number;
  amount: string | number;
}

export const providerColumns: TableColumnList = [
  {
    label: "排名",
    prop: "rank",
    width: 80
  },
  {
    label: "供应商名称",
    prop: "name"
  },
  {
    label: "订单数",
    prop: "count",
    width: 100
  },
  {
    label: "采购金额",
    width: 150,
    cellRenderer: ({ row }: { row: ProviderRow }) => {
      const formatAmount = (val: string | number) => {
        const num = Number(val) / 100;
        return num.toLocaleString("zh-CN", { minimumFractionDigits: 2 });
      };
      return <span>¥{formatAmount(row.amount)}</span>;
    }
  }
];

export const productColumns: TableColumnList = [
  {
    label: "排名",
    prop: "rank",
    width: 80
  },
  {
    label: "商品名称",
    prop: "name"
  },
  {
    label: "交易量",
    prop: "quantity",
    width: 100
  },
  {
    label: "交易金额",
    width: 150,
    cellRenderer: ({ row }: { row: ProductRow }) => {
      const formatAmount = (val: string | number) => {
        const num = Number(val) / 100;
        return num.toLocaleString("zh-CN", { minimumFractionDigits: 2 });
      };
      return <span>¥{formatAmount(row.amount)}</span>;
    }
  }
];
