import { http } from "@/utils/http";
import { baseUrlApi } from "./utils";
import type { CommonResult, PaginatedResponseDto } from "./type";

export type DocumentCenterType =
  | "RECEIPT"
  | "WRITE_OFF"
  | "OTHER_INCOME"
  | "OTHER_EXPENSE"
  | "TRANSFER"
  | "INVENTORY_TRANSFER"
  | "STOCKTAKING"
  | "OTHER_INBOUND"
  | "OTHER_OUTBOUND"
  | "ASSEMBLY"
  | "DISASSEMBLY"
  | "COST_ADJUST"
  | "PAYMENT"
  | "PURCHASE_ORDER"
  | "PURCHASE_INBOUND"
  | "PURCHASE_RETURN"
  | "SALE_ORDER"
  | "SALE_OUTBOUND"
  | "SALE_RETURN"
  | "CLAIM"
  | "SUPPLIER_CLAIM"
  | "WARRANTY"
  | "INSTALLATION"
  | "COMMISSION"
  | "SPECIAL_PRICE"
  | "SUPPLIER_PROMOTION";

export interface DocumentCenterItem {
  id: number;
  uid: string;
  documentType: DocumentCenterType;
  documentTypeLabel: string;
  billNo: string;
  targetName?: string;
  amount?: string | number;
  count?: number;
  status: string;
  operatorName?: string;
  remark?: string;
  createdAt?: string;
}

export interface QueryDocumentCenterParams {
  pageSize?: number;
  documentType?: DocumentCenterType;
  status?: string;
  targetName?: string;
  keyword?: string;
  startDate?: string;
  endDate?: string;
}

export interface ApproveDocumentCenterItem {
  documentType: DocumentCenterType;
  uid: string;
}

export interface DocumentCenterPrintDto {
  documentType: DocumentCenterType;
  uid: string;
  billNo: string;
  status: string;
  targetName?: string;
  detail: Record<string, string>;
  lines: Array<{
    uid: string;
    tireId: string;
    tireName: string;
    repoName: string;
    count: number;
    unitPrice: string;
    totalAmount: string;
  }>;
}

const prefix = "/document-center";

export function getDocumentCenterListApi(
  index: number,
  params?: QueryDocumentCenterParams
) {
  return http.request<CommonResult<PaginatedResponseDto<DocumentCenterItem>>>(
    "get",
    baseUrlApi(`${prefix}/page/${index}`),
    { params }
  );
}

export function approveDocumentCenterApi(items: ApproveDocumentCenterItem[]) {
  return http.request<
    CommonResult<
      Array<{
        documentType: DocumentCenterType;
        uid: string;
        success: boolean;
        message: string;
      }>
    >
  >("post", baseUrlApi(`${prefix}/approve`), {
    data: { items }
  });
}

export function reverseAuditDocumentCenterApi(
  items: ApproveDocumentCenterItem[],
  reason?: string
) {
  return http.request<
    CommonResult<
      Array<{
        documentType: DocumentCenterType;
        uid: string;
        success: boolean;
        message: string;
      }>
    >
  >("post", baseUrlApi(`${prefix}/reverse-audit`), {
    data: { items, reason }
  });
}

export function exportDocumentCenterApi(params?: QueryDocumentCenterParams) {
  return http.request<Blob>("get", baseUrlApi(`${prefix}/export`), {
    params,
    responseType: "blob"
  });
}

export function getDocumentCenterPrintApi(
  documentType: DocumentCenterType,
  uid: string
) {
  return http.request<CommonResult<DocumentCenterPrintDto>>(
    "get",
    baseUrlApi(`${prefix}/print/${documentType}/${uid}`)
  );
}

export function getDocumentCenterPdfApi(
  documentType: DocumentCenterType,
  uid: string
) {
  return http.request<Blob>(
    "get",
    baseUrlApi(`${prefix}/print/${documentType}/${uid}/pdf`),
    { responseType: "blob" }
  );
}
