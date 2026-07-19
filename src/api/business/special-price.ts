import { http } from "../../utils/http";
import { baseUrlApi } from "../utils";
import type { CommonResult } from "../type";

const prefix = "/special-price-request";

export type SpecialPriceRequestStatus =
  | "PENDING_APPROVAL"
  | "APPROVED"
  | "REJECTED"
  | "USED"
  | "CANCELLED";

export interface SpecialPriceRequest {
  uid: string;
  companyId: string;
  customerId: string;
  tireId: string;
  requestedById: string;
  approvedById?: string | null;
  saleOrderUid?: string | null;
  baselinePriceListId?: number | null;
  baselineSource?: string | null;
  baselinePrice: string;
  requestedPrice: string;
  differenceAmount: string;
  quantity: number;
  reason: string;
  rejectReason?: string | null;
  status: SpecialPriceRequestStatus;
  expiresAt?: string | null;
  approvedAt?: string | null;
  usedAt?: string | null;
  createdAt: string;
}

export interface CreateSpecialPriceRequestInput {
  customerId: string;
  tireId: string;
  quantity: number;
  requestedPrice: number;
  reason: string;
  expiresAt?: string;
}

export interface SpecialPricePage {
  count: number;
  list: SpecialPriceRequest[];
  pageSize?: number;
}

export function getSpecialPriceRequestsApi(
  index: number,
  params?: { status?: SpecialPriceRequestStatus; customerId?: string }
) {
  return http.request<CommonResult<SpecialPricePage>>(
    "get",
    baseUrlApi(`${prefix}/page/${index}`),
    { params }
  );
}

export function createSpecialPriceRequestApi(
  data: CreateSpecialPriceRequestInput
) {
  return http.request<CommonResult<SpecialPriceRequest>>(
    "post",
    baseUrlApi(prefix),
    { data }
  );
}

export function approveSpecialPriceRequestApi(uid: string) {
  return http.request<CommonResult<SpecialPriceRequest>>(
    "post",
    baseUrlApi(`${prefix}/${uid}/approve`)
  );
}

export function rejectSpecialPriceRequestApi(uid: string, reason: string) {
  return http.request<CommonResult<SpecialPriceRequest>>(
    "post",
    baseUrlApi(`${prefix}/${uid}/reject`),
    { data: { reason } }
  );
}
