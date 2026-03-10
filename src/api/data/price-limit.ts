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
}

export interface PriceLimitQuery {
  tireId?: string;
  keyword?: string;
  pageSize?: number;
}

const prefix = "/data-config/price-limit";

export async function getPriceLimitListApi(
  index: number,
  params?: PriceLimitQuery
) {
  return await http.request<
    CommonResult<PaginatedResponseDto<PriceLimitRecord>>
  >("get", baseUrlApi(`${prefix}/page/${index}`), { params });
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
