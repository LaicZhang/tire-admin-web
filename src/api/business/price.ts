import { http } from "../../utils/http";
import { baseUrlApi } from "../utils";
import type { CommonResult, PaginatedResponseDto } from "../type";

const prefix = "/price/";

export interface PriceListDto {
  name: string;
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
  index: number,
  params?: PriceListQuery
) {
  return await http.request<CommonResult<PaginatedResponseDto<PriceList>>>(
    "get",
    baseUrlApi(prefix + "list/page/" + index),
    { params }
  );
}

export async function createPriceListApi(data: PriceListDto) {
  return await http.request<CommonResult<PriceList>>(
    "post",
    baseUrlApi(prefix + "list"),
    {
      data
    }
  );
}

export async function updatePriceListApi(
  id: string,
  data: Partial<PriceListDto>
) {
  return await http.request<CommonResult<PriceList>>(
    "patch",
    baseUrlApi(prefix + "list/" + id),
    {
      data
    }
  );
}

export async function deletePriceListApi(id: string) {
  return await http.request<CommonResult<void>>(
    "delete",
    baseUrlApi(prefix + "list/" + id)
  );
}

export async function getProductPriceApi(params: {
  tireId?: string;
  customerId?: string;
}) {
  return await http.request<CommonResult<{ price: number }>>(
    "get",
    baseUrlApi(prefix + "query"),
    {
      params
    }
  );
}

export async function assignPriceListApi(data: {
  priceListId: string;
  customerIds: string[];
}) {
  return await http.request<CommonResult<void>>(
    "post",
    baseUrlApi(prefix + "assign"),
    { data }
  );
}
