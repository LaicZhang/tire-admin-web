import { http } from "../../utils/http";
import { baseUrlApi } from "../utils";
import type { CommonResult } from "../type";

const prefix = "/supplier-promotion-policy";

export type SupplierPromotionType = "DISCOUNT" | "REBATE" | "GIFT";

export interface SupplierPromotionPolicy {
  uid: string;
  providerId: string;
  name: string;
  policyType: SupplierPromotionType;
  minPurchaseAmount: string;
  discountBasisPoints: number;
  rebateAmount: string;
  giftTireId?: string | null;
  giftQuantity: number;
  priority: number;
  isStackable: boolean;
  isActive: boolean;
  effectiveFrom: string;
  effectiveTo?: string | null;
  createdAt: string;
}

export interface SupplierPromotionPolicyInput {
  providerId: string;
  name: string;
  policyType: SupplierPromotionType;
  minPurchaseAmount?: number;
  discountBasisPoints?: number;
  rebateAmount?: number;
  giftTireId?: string;
  giftQuantity?: number;
  priority?: number;
  isStackable?: boolean;
  isActive?: boolean;
  effectiveFrom: string;
  effectiveTo?: string;
}

export interface SupplierPromotionPage {
  count: number;
  list: SupplierPromotionPolicy[];
  pageSize?: number;
}

export function getSupplierPromotionPoliciesApi(
  index: number,
  params?: { providerId?: string; policyType?: SupplierPromotionType }
) {
  return http.request<CommonResult<SupplierPromotionPage>>(
    "get",
    baseUrlApi(`${prefix}/page/${index}`),
    { params }
  );
}

export function createSupplierPromotionPolicyApi(
  data: SupplierPromotionPolicyInput
) {
  return http.request<CommonResult<SupplierPromotionPolicy>>(
    "post",
    baseUrlApi(prefix),
    { data }
  );
}

export function updateSupplierPromotionPolicyApi(
  uid: string,
  data: Partial<SupplierPromotionPolicyInput>
) {
  return http.request<CommonResult<SupplierPromotionPolicy>>(
    "patch",
    baseUrlApi(`${prefix}/${uid}`),
    { data }
  );
}

export function deactivateSupplierPromotionPolicyApi(uid: string) {
  return http.request<CommonResult<SupplierPromotionPolicy>>(
    "delete",
    baseUrlApi(`${prefix}/${uid}`)
  );
}
