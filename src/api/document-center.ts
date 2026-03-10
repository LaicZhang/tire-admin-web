import { http } from "@/utils/http";
import { baseUrlApi } from "./utils";
import type { CommonResult, PaginatedResponseDto } from "./type";

export type DocumentCenterType =
  | "RECEIPT"
  | "WRITE_OFF"
  | "OTHER_INCOME"
  | "OTHER_EXPENSE"
  | "TRANSFER"
  | "PAYMENT"
  | "PURCHASE_ORDER"
  | "PURCHASE_INBOUND"
  | "PURCHASE_RETURN"
  | "SALE_ORDER"
  | "SALE_OUTBOUND"
  | "SALE_RETURN";

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
