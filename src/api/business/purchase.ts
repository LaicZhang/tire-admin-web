import { http } from "../../utils/http";
import { baseUrlApi } from "../utils";
import type { CommonResult, PaginatedResponseDto } from "../type";

const prefix = "/purchase/";

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
  providerId: string;
  items?: Array<{ tireId: string; count: number; price?: number }>;
}

export interface PurchaseInquiry extends PurchaseInquiryDto {
  id: number;
  uid: string;
}

/** 采购计划 API */
export async function getPurchasePlanListApi(index: number, params?: object) {
  return await http.request<CommonResult<PaginatedResponseDto<PurchasePlan>>>(
    "get",
    baseUrlApi(prefix + "plan/" + index),
    { params }
  );
}

export async function createPurchasePlanApi(data: PurchasePlanDto) {
  return await http.request<CommonResult<PurchasePlan>>(
    "post",
    baseUrlApi(prefix + "plan"),
    {
      data
    }
  );
}

export async function updatePurchasePlanApi(
  id: string,
  data: Partial<PurchasePlanDto>
) {
  return await http.request<CommonResult<PurchasePlan>>(
    "patch",
    baseUrlApi(prefix + "plan/" + id),
    {
      data
    }
  );
}

export async function deletePurchasePlanApi(id: string) {
  return await http.request<CommonResult<void>>(
    "delete",
    baseUrlApi(prefix + "plan/" + id)
  );
}

/** 采购询价 API */
export async function getPurchaseInquiryListApi(
  index: number,
  params?: object
) {
  return await http.request<
    CommonResult<PaginatedResponseDto<PurchaseInquiry>>
  >("get", baseUrlApi(prefix + "inquiry/" + index), { params });
}

export async function createPurchaseInquiryApi(data: PurchaseInquiryDto) {
  return await http.request<CommonResult<PurchaseInquiry>>(
    "post",
    baseUrlApi(prefix + "inquiry"),
    {
      data
    }
  );
}

export async function updatePurchaseInquiryApi(
  id: string,
  data: Partial<PurchaseInquiryDto>
) {
  return await http.request<CommonResult<PurchaseInquiry>>(
    "patch",
    baseUrlApi(prefix + "inquiry/" + id),
    {
      data
    }
  );
}

export async function deletePurchaseInquiryApi(id: string) {
  return await http.request<CommonResult<void>>(
    "delete",
    baseUrlApi(prefix + "inquiry/" + id)
  );
}
