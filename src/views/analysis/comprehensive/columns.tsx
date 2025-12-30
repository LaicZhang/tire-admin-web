import type { TableColumnList } from "@pureadmin/table";
import { ElTag } from "element-plus";

function formatMoney(value: number) {
  return Number((value / 100).toFixed(2));
}

export function useColumns() {
  const claimLossColumns: TableColumnList = [
    { label: "理赔原因", prop: "reason" },
    { label: "次数", prop: "count" },
    {
      label: "金额",
      cellRenderer: ({ row }) => <span>¥{formatMoney(row.amount)}</span>
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
      cellRenderer: ({ row }) => (
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
      cellRenderer: ({ row }) => <span>{row.percentage.toFixed(1)}%</span>
    }
  ];

  const stockoutColumns: TableColumnList = [
    { label: "商品名称", prop: "name", minWidth: 150 },
    {
      label: "当前库存",
      prop: "currentStock",
      width: 100,
      cellRenderer: ({ row }) => <ElTag type="danger">{row.currentStock}</ElTag>
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
