import { http } from "../../utils/http";
import { baseUrlApi } from "../utils";
import type { CommonResult, PaginatedResponseDto } from "../type";

const inquiryPrefix = "/purchase-inquiry/";
const quotationPrefix = "/purchase-quotation/";

export type PurchaseInquiryStatus = "DRAFT" | "SENT" | "REPLIED" | "CLOSED";

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

export async function createPurchaseQuotationApi(data: object) {
  return await http.request<CommonResult>("post", baseUrlApi(quotationPrefix), {
    data
  });
}

export async function getPurchaseQuotationListApi(
  params?: Record<string, unknown>
) {
  return await http.request<CommonResult>("get", baseUrlApi(quotationPrefix), {
    params
  });
}
