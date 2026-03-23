import { http } from "@/utils/http";
import { baseUrlApi } from "../utils";
import type { CommonResult } from "../type";

export interface PriceInfoUpsertDto {
  tireId: string;
  priceLimitUid?: string;
  unit?: string;
  retailPrice?: number;
  purchasePrice?: number;
  wholesalePrice?: number;
  vipPrice?: number;
  memberPrice?: number;
  minSalePrice?: number;
  maxPurchasePrice?: number;
  enablePurchaseLimit?: boolean;
  enableSaleLimit?: boolean;
  remark?: string;
}

const prefix = "/data-config/price-info";

export async function upsertPriceInfoApi(data: PriceInfoUpsertDto) {
  return await http.request<
    CommonResult<{
      tire?: { uid: string };
      priceLimit?: { uid: string };
    }>
  >("post", baseUrlApi(prefix), { data });
}
