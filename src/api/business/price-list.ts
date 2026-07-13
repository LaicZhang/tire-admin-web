import { http } from "../../utils/http";
import { baseUrlApi } from "../utils";
import type { CommonResult, PaginatedResponseDto } from "../type";

const prefix = "/price-list";

export type PriceListType = "STANDARD" | "PROMOTION" | "SPECIAL";
export type ApiMoney = number | string;

export interface PriceListDto {
  name: string;
  type: PriceListType;
  isDefault?: boolean;
  isActive?: boolean;
  startDate?: string;
  endDate?: string;
}

export interface PriceList extends PriceListDto {
  id: number;
  uid: string;
  createdAt?: string;
}

export interface PriceListQuery {
  name?: string;
  isActive?: boolean;
}

export interface SalePriceQuoteRequest {
  customerId: string;
  lines: Array<{ tireId: string; count: number }>;
}

export interface SalePriceQuoteLine {
  tireId: string;
  count: number;
  unitPrice: ApiMoney;
  totalAmount: ApiMoney;
  priceListId: number;
  priceType: PriceListType;
  source: "PRICE_LIST";
}

export interface PriceQueryResult {
  price: ApiMoney;
  priceListId: number;
  priceType: PriceListType;
  minQuantity: number;
  source?: string;
}

export interface SalePriceQuote {
  customerId: string;
  lines: SalePriceQuoteLine[];
  totalAmount: ApiMoney;
}

export async function getPriceListListApi(
  index: number,
  params?: PriceListQuery
) {
  return await http.request<CommonResult<PaginatedResponseDto<PriceList>>>(
    "get",
    baseUrlApi(prefix),
    { params: { index, ...params } }
  );
}

export async function createPriceListApi(data: PriceListDto) {
  return await http.request<CommonResult<PriceList>>(
    "post",
    baseUrlApi(prefix),
    { data }
  );
}

export async function updatePriceListApi(
  id: number,
  data: Partial<PriceListDto>
) {
  return await http.request<CommonResult<PriceList>>(
    "patch",
    baseUrlApi(`${prefix}/${id}`),
    { data }
  );
}

export async function deletePriceListApi(id: number) {
  return await http.request<CommonResult<PriceList>>(
    "delete",
    baseUrlApi(`${prefix}/${id}`)
  );
}

export async function addPriceListDetailApi(
  id: number,
  data: { tireId: string; price: number; minQuantity?: number }
) {
  return await http.request<CommonResult>(
    "post",
    baseUrlApi(`${prefix}/${id}/detail`),
    { data }
  );
}

export async function deletePriceListDetailApi(detailId: number) {
  return await http.request<CommonResult>(
    "delete",
    baseUrlApi(`${prefix}/detail/${detailId}`)
  );
}

export async function assignPriceListToCustomerApi(
  id: number,
  data: { customerId: string; priority?: number }
) {
  return await http.request<CommonResult>(
    "post",
    baseUrlApi(`${prefix}/${id}/assign-customer`),
    { data }
  );
}

export async function queryPriceApi(params: {
  customerId: string;
  tireId: string;
  quantity?: number;
}) {
  return await http.request<CommonResult<PriceQueryResult>>(
    "get",
    baseUrlApi("/price/query"),
    { params }
  );
}

export async function quoteSalePriceApi(data: SalePriceQuoteRequest) {
  return await http.request<CommonResult<SalePriceQuote>>(
    "post",
    baseUrlApi("/price/quote"),
    { data }
  );
}
