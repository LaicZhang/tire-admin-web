import type { DocumentType } from "../printTemplate/types";

/** 所有单据类型（打印模板共享） */
export const documentTypes: DocumentType[] = [
  { value: "purchase_order", label: "采购订单" },
  { value: "purchase_in", label: "采购入库单" },
  { value: "purchase_return", label: "采购退货单" },
  { value: "sales_order", label: "销售订单" },
  { value: "sales_out", label: "销售出库单" },
  { value: "sales_return", label: "销售退货单" },
  { value: "transfer", label: "调拨单" },
  { value: "inventory_check", label: "盘点单" },
  { value: "other_in", label: "其他入库单" },
  { value: "other_out", label: "其他出库单" },
  { value: "receive", label: "收款单" },
  { value: "pay", label: "付款单" }
];
