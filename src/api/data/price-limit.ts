import { http } from "@/utils/http";
import { baseUrlApi } from "../utils";
import type { CommonResult, PaginatedResponseDto } from "../type";

export interface PriceLimitRecord {
  id?: number;
  uid: string;
  tireId: string;
  enablePurchaseLimit: boolean;
  enableSaleLimit: boolean;
  maxPurchasePrice?: number;
  minSalePrice?: number;
  wholesalePrice?: number;
  vipPrice?: number;
  memberPrice?: number;
  remark?: string;
  updatedAt?: string;
  tire?: { uid?: string; name?: string };
}

export interface PriceLimitUpsertDto {
  uid?: string;
  tireId: string;
  enablePurchaseLimit: boolean;
  enableSaleLimit: boolean;
  maxPurchasePrice?: number;
  minSalePrice?: number;
  wholesalePrice?: number;
  vipPrice?: number;
  memberPrice?: number;
  remark?: string;
  unit?: string;
}

export interface PriceLimitQuery {
  tireId?: string;
  tireIds?: string[];
  keyword?: string;
  pageSize?: number;
}

const prefix = "/data-config/price-limit";

export async function getPriceLimitListApi(
  index: number,
  params?: PriceLimitQuery
) {
  const query = {
    ...params,
    tireIds: params?.tireIds?.length ? params.tireIds.join(",") : undefined
  };
  return await http.request<
    CommonResult<PaginatedResponseDto<PriceLimitRecord>>
  >("get", baseUrlApi(`${prefix}/page/${index}`), { params: query });
}

export async function upsertPriceLimitApi(data: PriceLimitUpsertDto) {
  return await http.request<CommonResult<PriceLimitRecord>>(
    data.uid ? "patch" : "post",
    baseUrlApi(data.uid ? `${prefix}/${data.uid}` : prefix),
    { data }
  );
}

export async function deletePriceLimitApi(uid: string) {
  return await http.request<CommonResult<void>>(
    "delete",
    baseUrlApi(`${prefix}/${uid}`)
  );
}
