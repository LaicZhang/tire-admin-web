/** Sales Documents Module Types */

export type DocumentType = "order" | "outbound" | "return";

export interface DocumentItem {
  id?: number;
  uid: string;
  number?: string;
  type: DocumentType;
  typeName: string;
  customerId?: string;
  customerName?: string;
  count: number;
  total: number;
  status: boolean;
  isApproved: boolean;
  createdAt?: string;
  operatorName?: string;
  desc?: string;
}

export interface DocumentQueryParams {
  type?: DocumentType;
  customerId?: string;
  isApproved?: boolean;
  status?: boolean;
  startDate?: string;
  endDate?: string;
  keyword?: string;
}

export const DOCUMENT_TYPE_OPTIONS = [
  { label: "全部", value: "" },
  { label: "销售订单", value: "order" },
  { label: "销售出库单", value: "outbound" },
  { label: "销售退货单", value: "return" }
];
