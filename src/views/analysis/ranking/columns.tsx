const formatAmount = (val: string | number) => {
  const num = Number(val) / 100;
  return num.toLocaleString("zh-CN", { minimumFractionDigits: 2 });
};

interface RankRow {
  name: string;
  count: number;
  amount: number | string;
  profit?: number | string;
}

export function useColumns() {
  const customerColumns: TableColumnList = [
    {
      label: "排名",
      type: "index",
      width: 80,
      align: "center",
      cellRenderer: data => {
        const index = data.index;
        return (
          <span class={index < 3 ? "text-red-500 font-bold" : "text-gray-600"}>
            {index + 1}
          </span>
        );
      }
    },
    {
      label: "客户名称",
      prop: "name"
    },
    {
      label: "订单数",
      prop: "count",
      width: 120,
      sortable: true
    },
    {
      label: "交易总额",
      prop: "amount",
      sortable: true,
      cellRenderer: data => {
        const row = data.row as RankRow | undefined;
        return (
          <span class="font-bold text-blue-600">
            ¥{row ? formatAmount(row.amount) : "-"}
          </span>
        );
      }
    }
  ];

  const providerColumns: TableColumnList = [
    {
      label: "排名",
      type: "index",
      width: 80,
      align: "center",
      cellRenderer: data => {
        const index = data.index;
        return (
          <span class={index < 3 ? "text-red-500 font-bold" : "text-gray-600"}>
            {index + 1}
          </span>
        );
      }
    },
    {
      label: "供应商名称",
      prop: "name"
    },
    {
      label: "订单数",
      prop: "count",
      width: 120,
      sortable: true
    },
    {
      label: "采购总额",
      prop: "amount",
      sortable: true,
      cellRenderer: data => {
        const row = data.row as RankRow | undefined;
        return (
          <span class="font-bold text-green-600">
            ¥{row ? formatAmount(row.amount) : "-"}
          </span>
        );
      }
    }
  ];

  const productColumns: TableColumnList = [
    {
      label: "排名",
      type: "index",
      width: 80,
      align: "center",
      cellRenderer: data => {
        const index = data.index;
        return (
          <span class={index < 3 ? "text-red-500 font-bold" : "text-gray-600"}>
            {index + 1}
          </span>
        );
      }
    },
    {
      label: "商品名称",
      prop: "name"
    },
    {
      label: "交易量",
      prop: "quantity",
      width: 120,
      sortable: true
    },
    {
      label: "交易总额",
      prop: "amount",
      sortable: true,
      cellRenderer: data => {
        const row = data.row as RankRow | undefined;
        return <span>¥{row ? formatAmount(row.amount) : "-"}</span>;
      }
    },
    {
      label: "利润预估",
      prop: "profit",
      sortable: true,
      cellRenderer: data => {
        const row = data.row as RankRow | undefined;
        return (
          <span class="text-emerald-500">
            ¥{row ? formatAmount(row.profit ?? 0) : "-"}
          </span>
        );
      }
    }
  ];

  const operatorColumns: TableColumnList = [
    {
      label: "排名",
      type: "index",
      width: 80,
      align: "center",
      cellRenderer: data => {
        const index = data.index;
        return (
          <span class={index < 3 ? "text-red-500 font-bold" : "text-gray-600"}>
            {index + 1}
          </span>
        );
      }
    },
    {
      label: "员工姓名",
      prop: "name"
    },
    {
      label: "订单处理数",
      prop: "count",
      width: 150,
      sortable: true
    },
    {
      label: "涉及金额",
      prop: "amount",
      sortable: true,
      cellRenderer: data => {
        const row = data.row as RankRow | undefined;
        return (
          <span class="font-bold">¥{row ? formatAmount(row.amount) : "-"}</span>
        );
      }
    }
  ];

  return {
    customerColumns,
    providerColumns,
    productColumns,
    operatorColumns
  };
}
