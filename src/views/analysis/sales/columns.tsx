const formatAmount = (val: string | number) => {
  const num = Number(val) / 100;
  return num.toLocaleString("zh-CN", { minimumFractionDigits: 2 });
};

interface RankRow {
  name: string;
  count?: number;
  quantity?: number;
  amount: number | string;
  profit?: number | string;
}

export function useColumns() {
  const customerColumns: TableColumnList = [
    { label: "排名", prop: "rank", width: 80 },
    { label: "客户名称", prop: "name" },
    { label: "订单数", prop: "count", width: 100 },
    {
      label: "交易金额",
      width: 150,
      cellRenderer: data => {
        const row = data.row as RankRow | undefined;
        return <span>¥{row ? formatAmount(row.amount) : "-"}</span>;
      }
    }
  ];

  const productColumns: TableColumnList = [
    { label: "排名", prop: "rank", width: 80 },
    { label: "商品名称", prop: "name" },
    { label: "销量", prop: "quantity", width: 100 },
    {
      label: "销售金额",
      width: 150,
      cellRenderer: data => {
        const row = data.row as RankRow | undefined;
        return <span>¥{row ? formatAmount(row.amount) : "-"}</span>;
      }
    }
  ];

  const operatorColumns: TableColumnList = [
    { label: "排名", prop: "rank", width: 80 },
    { label: "员工姓名", prop: "name" },
    { label: "订单数", prop: "count", width: 100 },
    {
      label: "业绩金额",
      width: 150,
      cellRenderer: data => {
        const row = data.row as RankRow | undefined;
        return <span>¥{row ? formatAmount(row.amount) : "-"}</span>;
      }
    }
  ];

  return { customerColumns, productColumns, operatorColumns };
}
