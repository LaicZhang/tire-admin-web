import { http } from "@/utils/http";
import { baseUrlApi } from "../utils";
import type { CommonResult, PaginatedResponseDto } from "../type";

const legacyPrefix = "/quality/";
const inspectionPrefix = "/quality-inspection";

export interface DefectCategoryDto {
  name: string;
  description?: string;
  solution?: string;
}

export interface DefectCategory extends DefectCategoryDto {
  id: number;
  status?: number;
}

export type InspectionResult = "PASS" | "PARTIAL" | "FAIL";

export interface CreateQualityInspectionDto {
  purchaseOrderUid: string;
  detailId?: number;
  inspectedQty: number;
  qualifiedQty: number;
  unqualifiedQty: number;
  result: InspectionResult;
  handler?: string;
  inspectedAt: string;
  remark?: string;
}

export interface QualityInspectionRecord extends CreateQualityInspectionDto {
  id: number;
  uid?: string;
  purchaseOrder?: {
    uid?: string;
    docNo?: string | null;
    number?: string | null;
  } | null;
  inspectedBy?: {
    uid?: string;
    name?: string | null;
  } | null;
  createdAt?: string | null;
}

export interface QualityInspectionQuery {
  page?: number;
  purchaseOrderNo?: string;
  startDate?: string;
  endDate?: string;
}

function resolveInspectionQuery(params?: QualityInspectionQuery) {
  if (!params) return undefined;
  return {
    ...(params.page ? { index: params.page } : {}),
    ...(params.purchaseOrderNo
      ? { purchaseOrderNo: params.purchaseOrderNo }
      : {}),
    ...(params.startDate ? { startDate: params.startDate } : {}),
    ...(params.endDate ? { endDate: params.endDate } : {})
  };
}

export async function getDefectCategoryListApi(params?: {
  name?: string;
  status?: number;
}) {
  return await http.request<CommonResult<DefectCategory[]>>(
    "get",
    baseUrlApi(legacyPrefix + "defect-categories"),
    { params }
  );
}

export async function createDefectCategoryApi(data: DefectCategoryDto) {
  return await http.request<CommonResult<DefectCategory>>(
    "post",
    baseUrlApi(legacyPrefix + "defect-categories"),
    { data }
  );
}

export async function updateDefectCategoryApi(
  id: number,
  data: Partial<DefectCategoryDto> & { status?: number }
) {
  return await http.request<CommonResult<DefectCategory>>(
    "patch",
    baseUrlApi(legacyPrefix + `defect-categories/${id}`),
    { data }
  );
}

export async function deleteDefectCategoryApi(id: number) {
  return await http.request<CommonResult<void>>(
    "delete",
    baseUrlApi(legacyPrefix + `defect-categories/${id}`)
  );
}

export async function getQualityInspectionListApi(
  params?: QualityInspectionQuery
) {
  return await http.request<
    CommonResult<PaginatedResponseDto<QualityInspectionRecord>>
  >("get", baseUrlApi(inspectionPrefix), {
    params: resolveInspectionQuery(params)
  });
}

export async function createQualityInspectionApi(
  data: CreateQualityInspectionDto
) {
  return await http.request<CommonResult<QualityInspectionRecord>>(
    "post",
    baseUrlApi(inspectionPrefix),
    { data }
  );
}
