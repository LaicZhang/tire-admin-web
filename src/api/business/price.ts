import type { CommonResult, PaginatedResponseDto } from "../type";
import { unsupportedBackendRoute } from "../route-gap";

/**
 * T3-X-002：零引用死封装。真实价格模块是 `@/api/business/price-list`，
 * 此前缀 `/price/` 后端不存在。
 */

export interface PriceListDto {
  name: string;
  /** 价格表类型（例如 SYSTEM / CUSTOM） */
  type?: string;
  desc?: string;
  items?: Array<{ tireId: string; price: number }>;
}

export interface PriceList extends PriceListDto {
  id: number;
  uid: string;
}

/** 价格表查询参数 */
export interface PriceListQuery {
  name?: string;
  keyword?: string;
}

export async function getPriceListListApi(
  _index: number,
  _params?: PriceListQuery
): Promise<CommonResult<PaginatedResponseDto<PriceList>>> {
  return unsupportedBackendRoute("GET /price/list/page/:index");
}

export async function createPriceListApi(
  _data: PriceListDto
): Promise<CommonResult<PriceList>> {
  return unsupportedBackendRoute("POST /price/list");
}

export async function updatePriceListApi(
  _id: string,
  _data: Partial<PriceListDto>
): Promise<CommonResult<PriceList>> {
  return unsupportedBackendRoute("PATCH /price/list/:id");
}

export async function deletePriceListApi(
  _id: string
): Promise<CommonResult<void>> {
  return unsupportedBackendRoute("DELETE /price/list/:id");
}

export interface ProductPriceQueryResult extends Record<string, unknown> {
  price: number;
  tireName?: string;
  source?: string;
  strategy?: string;
}

export async function getProductPriceApi(_params: {
  tireId?: string;
  customerId?: string;
}): Promise<CommonResult<ProductPriceQueryResult>> {
  return unsupportedBackendRoute("GET /price/query");
}

export async function assignPriceListApi(_data: {
  priceListId: string;
  customerIds: string[];
}): Promise<CommonResult<void>> {
  return unsupportedBackendRoute("POST /price/assign");
}
