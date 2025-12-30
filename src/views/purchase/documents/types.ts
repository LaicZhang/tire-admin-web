/** Purchase Documents Module Types */

export type DocumentType = "order" | "inbound" | "return";

export interface DocumentItem {
  id?: number;
  uid: string;
  number?: string;
  type: DocumentType;
  typeName: string;
  providerId?: string;
  providerName?: string;
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
  providerId?: string;
  isApproved?: boolean;
  status?: boolean;
  startDate?: string;
  endDate?: string;
  keyword?: string;
}

export const DOCUMENT_TYPE_OPTIONS = [
  { label: "全部", value: "" },
  { label: "采购订单", value: "order" },
  { label: "采购入库单", value: "inbound" },
  { label: "采购退货单", value: "return" }
];
