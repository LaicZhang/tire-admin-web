import { h } from "vue";
import { ElTag } from "element-plus";
import type { OrderDetailRow } from "./types";

export const detailColumns: TableColumnList = [
  {
    label: "商品名称",
    minWidth: 150,
    slot: "productName"
  },
  {
    label: "数量",
    width: 100,
    slot: "quantity"
  },
  {
    label: "单位",
    width: 80,
    slot: "unit"
  },
  {
    label: "单价",
    width: 100,
    slot: "price"
  },
  {
    label: "金额",
    width: 100,
    align: "right",
    cellRenderer: ({ row }: { row: OrderDetailRow }) =>
      h(
        "span",
        { class: "text-blue-500" },
        ((row.amount || 0) as number).toFixed(2)
      )
  },
  {
    label: "状态",
    width: 80,
    align: "center",
    cellRenderer: ({ row }: { row: OrderDetailRow }) => {
      if (row.productUid)
        return h(ElTag, { type: "success", size: "small" }, () => "已匹配");
      if (row.isNew)
        return h(ElTag, { type: "warning", size: "small" }, () => "新增");
      return h(ElTag, { type: "danger", size: "small" }, () => "未匹配");
    }
  },
  {
    label: "操作",
    width: 60,
    align: "center",
    slot: "action"
  }
];
