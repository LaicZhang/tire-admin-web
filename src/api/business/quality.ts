import { http } from "@/utils/http";
import { baseUrlApi } from "../utils";
import type { CommonResult, PaginatedResponseDto } from "../type";

const prefix = "/quality/";

export interface DefectCategoryDto {
  name: string;
  description?: string;
  solution?: string;
}

export interface DefectCategory extends DefectCategoryDto {
  id: number;
  status?: number;
}

export interface InspectionRecordDto {
  purchaseOrderId: string;
  inspectorId: string;
  items: Array<{
    tireId: string;
    quantity: number;
    qualifiedQuantity: number;
    defectQuantity: number;
    defectCategoryId?: number;
    remark?: string;
  }>;
  remark?: string;
}

export interface InspectionRecord extends InspectionRecordDto {
  id: number;
  uid: string;
}

/** 获取缺陷分类列表 */
export async function getDefectCategoryListApi(params?: {
  name?: string;
  status?: number;
}) {
  return await http.request<CommonResult<DefectCategory[]>>(
    "get",
    baseUrlApi(prefix + "defect-categories"),
    { params }
  );
}

/** 创建缺陷分类 */
export async function createDefectCategoryApi(data: DefectCategoryDto) {
  return await http.request<CommonResult<DefectCategory>>(
    "post",
    baseUrlApi(prefix + "defect-categories"),
    { data }
  );
}

/** 更新缺陷分类 */
export async function updateDefectCategoryApi(
  id: number,
  data: Partial<DefectCategoryDto> & { status?: number }
) {
  return await http.request<CommonResult<DefectCategory>>(
    "patch",
    baseUrlApi(prefix + `defect-categories/${id}`),
    { data }
  );
}

/** 删除缺陷分类 */
export async function deleteDefectCategoryApi(id: number) {
  return await http.request<CommonResult<void>>(
    "delete",
    baseUrlApi(prefix + `defect-categories/${id}`)
  );
}

/** 获取质检记录列表 */
export async function getInspectionRecordListApi(
  index: number,
  params?: {
    purchaseOrderNo?: string;
    providerId?: string;
    startDate?: string;
    endDate?: string;
  }
) {
  return await http.request<
    CommonResult<PaginatedResponseDto<InspectionRecord>>
  >("get", baseUrlApi(prefix + `inspection-records/${index}`), { params });
}

/** 创建质检记录 */
export async function createInspectionRecordApi(data: InspectionRecordDto) {
  return await http.request<CommonResult<InspectionRecord>>(
    "post",
    baseUrlApi(prefix + "inspection-records"),
    { data }
  );
}

/** 获取质检记录详情 */
export async function getInspectionRecordApi(id: string) {
  return await http.request<CommonResult<InspectionRecord>>(
    "get",
    baseUrlApi(prefix + `inspection-records/detail/${id}`)
  );
}
