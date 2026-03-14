import { http } from "../../utils/http";
import { baseUrlApi } from "../utils";
import type { CommonResult, PaginatedResponseDto } from "../type";

const inquiryPrefix = "/purchase-inquiry/";
const quotationPrefix = "/purchase-quotation/";

export type PurchaseInquiryStatus = "DRAFT" | "SENT" | "REPLIED" | "CLOSED";
export type PurchaseQuotationStatus = "PENDING" | "ACCEPTED" | "REJECTED";

export interface PurchaseInquiryDetailDto {
  tireId: string;
  quantity: number;
  expectedPrice?: number;
}

export interface CreatePurchaseInquiryApiDto {
  providerId?: string;
  deadline?: string;
  remark?: string;
  details: PurchaseInquiryDetailDto[];
}

export interface PurchaseInquiryDto {
  id: number;
  uid?: string;
  providerId?: string | null;
  provider?: {
    uid?: string;
    name?: string | null;
  } | null;
  status: PurchaseInquiryStatus;
  deadline?: string | null;
  remark?: string | null;
  details: Array<
    PurchaseInquiryDetailDto & {
      id?: number;
      tire?: {
        uid?: string;
        name?: string | null;
      } | null;
    }
  >;
  responses?: Array<{
    id?: number;
    status?: PurchaseQuotationStatus;
    purchaseOrderId?: string | null;
  }>;
  createdAt?: string | null;
  updatedAt?: string | null;
  [key: string]: unknown;
}

export interface PurchaseInquiryQuery {
  page?: number;
  limit?: number;
  providerId?: string;
  status?: PurchaseInquiryStatus;
}

function resolveListParams(params?: PurchaseInquiryQuery) {
  if (!params) return undefined;
  return {
    ...(params.page ? { index: params.page } : {}),
    ...(params.limit ? { limit: params.limit } : {}),
    ...(params.providerId ? { providerId: params.providerId } : {}),
    ...(params.status ? { status: params.status } : {})
  };
}

export async function createPurchaseInquiryApi(
  data: CreatePurchaseInquiryApiDto
) {
  return await http.request<CommonResult<PurchaseInquiryDto>>(
    "post",
    baseUrlApi(inquiryPrefix),
    {
      data
    }
  );
}

export async function getPurchaseInquiryListApi(params?: PurchaseInquiryQuery) {
  return await http.request<
    CommonResult<PaginatedResponseDto<PurchaseInquiryDto>>
  >("get", baseUrlApi(inquiryPrefix), {
    params: resolveListParams(params)
  });
}

export async function sendPurchaseInquiryApi(id: number) {
  return await http.request<CommonResult<PurchaseInquiryDto>>(
    "post",
    baseUrlApi(inquiryPrefix + id + "/send")
  );
}

export interface PurchaseQuotationDetailDto {
  tireId: string;
  price: number;
  quantity: number;
  leadTime?: number;
}

export interface CreatePurchaseQuotationApiDto {
  inquiryId: number;
  providerId: string;
  validUntil?: string;
  remark?: string;
  details: PurchaseQuotationDetailDto[];
}

export interface ConvertPurchaseQuotationApiDto {
  auditorId: string;
  repoId: string;
  desc?: string;
}

export interface PurchaseQuotationDto {
  id: number;
  uid?: string;
  inquiryId: number;
  providerId: string;
  provider?: {
    uid?: string;
    name?: string | null;
  } | null;
  inquiry?: {
    id?: number;
    uid?: string;
  } | null;
  purchaseOrderId?: string | null;
  purchaseOrder?: {
    uid?: string;
    docNo?: string | null;
    number?: string | number | null;
  } | null;
  status: PurchaseQuotationStatus;
  validUntil?: string | null;
  remark?: string | null;
  details: Array<
    PurchaseQuotationDetailDto & {
      id?: number;
    }
  >;
  createdAt?: string | null;
}

export interface PurchaseQuotationQuery {
  page?: number;
  limit?: number;
  inquiryId?: number;
  providerId?: string;
}

function resolveQuotationParams(params?: PurchaseQuotationQuery) {
  if (!params) return undefined;
  return {
    ...(params.page ? { index: params.page } : {}),
    ...(params.limit ? { limit: params.limit } : {}),
    ...(typeof params.inquiryId === "number"
      ? { inquiryId: params.inquiryId }
      : {}),
    ...(params.providerId ? { providerId: params.providerId } : {})
  };
}

export async function createPurchaseQuotationApi(
  data: CreatePurchaseQuotationApiDto
) {
  return await http.request<CommonResult<PurchaseQuotationDto>>(
    "post",
    baseUrlApi(quotationPrefix),
    {
      data
    }
  );
}

export async function acceptPurchaseQuotationApi(id: number) {
  return await http.request<CommonResult<PurchaseQuotationDto>>(
    "post",
    baseUrlApi(`${quotationPrefix}${id}/accept`)
  );
}

export async function convertPurchaseQuotationApi(
  id: number,
  data: ConvertPurchaseQuotationApiDto
) {
  return await http.request<CommonResult<PurchaseQuotationDto>>(
    "post",
    baseUrlApi(`${quotationPrefix}${id}/convert`),
    {
      data
    }
  );
}

export async function getPurchaseQuotationListApi(
  params?: PurchaseQuotationQuery
) {
  return await http.request<
    CommonResult<PaginatedResponseDto<PurchaseQuotationDto>>
  >("get", baseUrlApi(quotationPrefix), {
    params: resolveQuotationParams(params)
  });
}
