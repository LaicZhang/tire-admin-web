import type { TableColumnRenderer } from "@pureadmin/table";

const formatAmount = (val: string | number) => {
  const num = Number(val);
  return num.toLocaleString("zh-CN", { minimumFractionDigits: 2 });
};

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
      return <span>¥{formatAmount(data.row?.amount)}</span>;
    }
  }
];

export const trackingColumns: TableColumnList = [
  { label: "单号", prop: "number", minWidth: 140 },
  { label: "供应商", prop: "providerName", minWidth: 140 },
  { label: "采购员", prop: "operatorName", minWidth: 120 },
  {
    label: "金额",
    minWidth: 140,
    cellRenderer: (data: TableColumnRenderer) => (
      <span>¥{formatAmount(data.row?.total ?? 0)}</span>
    )
  },
  { label: "状态", prop: "trackingStatus", minWidth: 100 },
  { label: "日期", prop: "createAt", minWidth: 160 }
];

export const evaluationColumns: TableColumnList = [
  { label: "供应商", prop: "providerName", minWidth: 140 },
  { label: "订单数", prop: "totalOrders", width: 100 },
  { label: "完成率", prop: "completionRate", width: 100 },
  { label: "准时率", prop: "onTimeRate", width: 100 },
  { label: "平均交付天数", prop: "avgDeliveryDays", width: 120 },
  { label: "评分", prop: "score", width: 90 }
];
