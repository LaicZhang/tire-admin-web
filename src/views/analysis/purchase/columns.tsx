import type { TableColumnRenderer } from "@pureadmin/table";

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
    cellRenderer: (data: TableColumnRenderer) => {
      const formatAmount = (val: string | number) => {
        const num = Number(val) / 100;
        return num.toLocaleString("zh-CN", { minimumFractionDigits: 2 });
      };
      return <span>¥{formatAmount(data.row?.amount)}</span>;
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
    cellRenderer: (data: TableColumnRenderer) => {
      const formatAmount = (val: string | number) => {
        const num = Number(val) / 100;
        return num.toLocaleString("zh-CN", { minimumFractionDigits: 2 });
      };
      return <span>¥{formatAmount(data.row?.amount)}</span>;
    }
  }
];
