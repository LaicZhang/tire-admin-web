import type { CommonResult, PaginatedResponseDto } from "../type";
import { unsupportedBackendRoute } from "../route-gap";

/**
 * T3-X-002：零引用死封装。真实模块是 purchase-plan / purchase-inquiry，
 * 此前缀 `/purchase/` 后端不存在。
 */

export interface PurchasePlanDto {
  providerId?: string;
  desc?: string;
  items?: Array<{ tireId: string; count: number }>;
}

export interface PurchasePlan extends PurchasePlanDto {
  id: number;
  uid: string;
}

export interface PurchaseInquiryDto {
  providerId?: string;
  providerName?: string;
  desc?: string;
  status?: string;
  inquiryNo?: string;
  planNo?: string;
  items?: Array<{ tireId: string; count: number; price?: number }>;
}

export interface PurchaseInquiry extends PurchaseInquiryDto {
  id: number;
  uid: string;
}

/** 采购计划查询参数 */
export interface PurchasePlanQuery {
  providerId?: string;
  status?: string;
  keyword?: string;
  startDate?: string;
  endDate?: string;
}

export async function getPurchasePlanListApi(
  _index: number,
  _params?: PurchasePlanQuery
): Promise<CommonResult<PaginatedResponseDto<PurchasePlan>>> {
  return unsupportedBackendRoute("GET /purchase/plan/:index");
}

export async function createPurchasePlanApi(
  _data: PurchasePlanDto
): Promise<CommonResult<PurchasePlan>> {
  return unsupportedBackendRoute("POST /purchase/plan");
}

export async function updatePurchasePlanApi(
  _id: string,
  _data: Partial<PurchasePlanDto>
): Promise<CommonResult<PurchasePlan>> {
  return unsupportedBackendRoute("PATCH /purchase/plan/:id");
}

export async function deletePurchasePlanApi(
  _id: string
): Promise<CommonResult<void>> {
  return unsupportedBackendRoute("DELETE /purchase/plan/:id");
}

/** 采购询价查询参数 */
export interface PurchaseInquiryQuery {
  providerId?: string;
  status?: string;
  inquiryNo?: string;
  keyword?: string;
  startDate?: string;
  endDate?: string;
}

export async function getPurchaseInquiryListApi(
  _index: number,
  _params?: PurchaseInquiryQuery
): Promise<CommonResult<PaginatedResponseDto<PurchaseInquiry>>> {
  return unsupportedBackendRoute("GET /purchase/inquiry/:index");
}

export async function createPurchaseInquiryApi(
  _data: PurchaseInquiryDto
): Promise<CommonResult<PurchaseInquiry>> {
  return unsupportedBackendRoute("POST /purchase/inquiry");
}

export async function updatePurchaseInquiryApi(
  _id: string,
  _data: Partial<PurchaseInquiryDto>
): Promise<CommonResult<PurchaseInquiry>> {
  return unsupportedBackendRoute("PATCH /purchase/inquiry/:id");
}

export async function deletePurchaseInquiryApi(
  _id: string
): Promise<CommonResult<void>> {
  return unsupportedBackendRoute("DELETE /purchase/inquiry/:id");
}
