import { http } from "@/utils/http";
import { baseUrlApi } from "../utils";
import type { CommonResult, PaginatedResponseDto } from "../type";
import { unsupportedBackendRoute } from "../route-gap";

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
export type QualityInspectionDisposalStatus =
  | "PENDING"
  | "RETURN_CREATED"
  | "COMPLETED";

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

export interface ConvertQualityInspectionReturnDto {
  auditorId: string;
  desc?: string;
}

export interface QualityInspectionRecord extends CreateQualityInspectionDto {
  id: number;
  uid?: string;
  disposalStatus?: QualityInspectionDisposalStatus;
  purchaseOrder?: {
    uid?: string;
    docNo?: string | null;
    number?: string | null;
  } | null;
  returnOrder?: {
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

function defectCategoryBody(data: DefectCategoryDto & { code?: string; remark?: string }) {
  const body: { name: string; code?: string; remark?: string } = {
    name: data.name
  };
  if (data.code) body.code = data.code;
  const remark = data.remark ?? data.description;
  if (remark) body.remark = remark;
  return body;
}

/** 真实路由是 GET /claim-order/defect-category，返回数组。 */
export async function getDefectCategoryListApi(params?: {
  name?: string;
  status?: number;
}) {
  const result = await http.request<CommonResult<DefectCategory[]>>(
    "get",
    baseUrlApi("/claim-order/defect-category")
  );
  const list = Array.isArray(result.data) ? result.data : [];
  const filtered = list.filter(item => {
    if (params?.name && !item.name.includes(params.name)) return false;
    if (params?.status != null && item.status !== params.status) return false;
    return true;
  });
  return { ...result, data: filtered };
}

export async function createDefectCategoryApi(data: DefectCategoryDto) {
  return await http.request<CommonResult<DefectCategory>>(
    "post",
    baseUrlApi("/claim-order/defect-category"),
    { data: defectCategoryBody(data) }
  );
}

/** 后端没有 PATCH /claim-order/defect-category/:id。 */
export async function updateDefectCategoryApi(
  _id: number,
  _data: Partial<DefectCategoryDto> & { status?: number }
) {
  return unsupportedBackendRoute("PATCH /claim-order/defect-category/:id");
}

/** 后端没有 DELETE /claim-order/defect-category/:id。 */
export async function deleteDefectCategoryApi(_id: number) {
  return unsupportedBackendRoute("DELETE /claim-order/defect-category/:id");
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

export async function convertQualityInspectionReturnApi(
  id: number,
  data: ConvertQualityInspectionReturnDto
) {
  return await http.request<CommonResult<QualityInspectionRecord>>(
    "post",
    baseUrlApi(`${inspectionPrefix}/${id}/convert-return`),
    { data }
  );
}
