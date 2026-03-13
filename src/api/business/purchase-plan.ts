import { http } from "../../utils/http";
import { baseUrlApi } from "../utils";
import type { CommonResult, PaginatedResponseDto } from "../type";

const prefix = "/purchase-plan/";

export interface PurchasePlanFormData {
  tireId: string;
  count: number;
  repoId?: string;
  period?: number;
  basedOn?: string;
}

export interface PurchasePlanRecord {
  id: number;
  uid?: string;
  tireId: string;
  tire?: {
    uid?: string;
    name?: string;
    size?: string;
  };
  repo?: {
    uid: string;
    name: string;
  };
  purchaseOrder?: {
    uid: string;
    docNo: string;
  };
  count: number;
  note?: string;
  source: "auto" | "manual";
  status: "pending" | "ordered" | "cancelled";
  predictedQuantity?: number | null;
  suggestedQuantity?: number | null;
  createdAt?: string;
  [key: string]: unknown;
}

export interface PurchasePlanQuery {
  page?: number;
  limit?: number;
  status?: PurchasePlanRecord["status"];
}

export interface ConvertPurchasePlanDto {
  providerId: string;
  auditorId: string;
  repoId?: string;
  desc?: string;
}

export async function createPurchasePlanApi(data: PurchasePlanFormData) {
  return await http.request<CommonResult<PurchasePlanRecord>>(
    "post",
    baseUrlApi(prefix),
    {
      data
    }
  );
}

export async function getPurchasePlanListApi(params?: PurchasePlanQuery) {
  return await http.request<
    CommonResult<PaginatedResponseDto<PurchasePlanRecord>>
  >("get", baseUrlApi(prefix), {
    params
  });
}

export async function convertPurchasePlanApi(
  id: number,
  data: ConvertPurchasePlanDto
) {
  return await http.request<
    CommonResult<{
      planId: number;
      purchaseOrderUid?: string;
      purchaseOrderDocNo?: string;
    }>
  >("post", baseUrlApi(prefix + `${id}/convert`), {
    data
  });
}

export async function deletePurchasePlanApi(id: number) {
  return await http.request<CommonResult<void>>(
    "delete",
    baseUrlApi(prefix + id)
  );
}

export async function predictPurchasePlanApi(params: {
  tireId: string;
  period: number;
}) {
  return await http.request<CommonResult>(
    "get",
    baseUrlApi(prefix + "predict"),
    {
      params
    }
  );
}
