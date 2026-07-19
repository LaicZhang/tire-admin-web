import { http } from "../../utils/http";
import { baseUrlApi } from "../utils";
import type { CommonResult, PaginatedResponseDto } from "../type";

const prefix = "/sale-quotation/";

export type SaleQuotationStatus =
  | "DRAFT"
  | "SENT"
  | "ACCEPTED"
  | "REJECTED"
  | "EXPIRED";

export interface SaleQuotationDetailDto {
  tireId: string;
  quantity: number;
  originalPrice?: number;
  quotedPrice: number;
  discount?: number;
  remark?: string;
}

export interface SaleQuotationDto {
  id: number;
  uid?: string;
  quotationNo: string;
  customerId: string;
  customer?: { uid: string; name?: string | null } | null;
  operator?: { uid: string; name?: string | null } | null;
  validUntil?: string | null;
  totalAmount?: number | string | null;
  remark?: string | null;
  status: SaleQuotationStatus;
  details?: SaleQuotationDetailDto[];
  orders?: Array<{ saleOrderUid: string }>;
  createdAt?: string;
}

export interface CreateSaleQuotationApiDto {
  customerId: string;
  quotationNo?: string;
  validUntil?: string;
  remark?: string;
  details: SaleQuotationDetailDto[];
}

export interface SaleQuotationQueryDto {
  index?: number;
  uid?: string;
  customerId?: string;
  quotationNo?: string;
  status?: SaleQuotationStatus;
}

export async function createSaleQuotationApi(data: CreateSaleQuotationApiDto) {
  return await http.request<CommonResult<SaleQuotationDto>>(
    "post",
    baseUrlApi(prefix),
    { data }
  );
}

export async function getSaleQuotationOrderListApi(
  params?: SaleQuotationQueryDto
) {
  const index =
    typeof params?.index === "number" && Number.isFinite(params.index)
      ? params.index
      : 1;
  return await http.request<
    CommonResult<PaginatedResponseDto<SaleQuotationDto>>
  >("get", baseUrlApi(prefix), { params: { ...params, index } });
}

export async function updateSaleQuotationStatusApi(
  id: number,
  status: SaleQuotationStatus
) {
  return await http.request<CommonResult<SaleQuotationDto>>(
    "post",
    baseUrlApi(prefix + id + "/status"),
    {
      data: { status }
    }
  );
}

export async function convertSaleQuotationApi(
  id: number,
  saleOrderUid: string
) {
  return await http.request<CommonResult<SaleQuotationDto>>(
    "post",
    baseUrlApi(prefix + id + "/convert"),
    { data: { saleOrderUid } }
  );
}
