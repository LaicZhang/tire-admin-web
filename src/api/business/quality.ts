import { http } from "@/utils/http";
import { baseUrlApi } from "../utils";
import type { CommonResult } from "../type";

const prefix = "/quality/";

/** 获取缺陷分类列表 */
export async function getDefectCategoryListApi(params?: {
  name?: string;
  status?: number;
}) {
  return await http.request<CommonResult>(
    "get",
    baseUrlApi(prefix + "defect-categories"),
    { params }
  );
}

/** 创建缺陷分类 */
export async function createDefectCategoryApi(data: {
  name: string;
  description?: string;
  solution?: string;
}) {
  return await http.request<CommonResult>(
    "post",
    baseUrlApi(prefix + "defect-categories"),
    { data }
  );
}

/** 更新缺陷分类 */
export async function updateDefectCategoryApi(
  id: number,
  data: {
    name?: string;
    description?: string;
    solution?: string;
    status?: number;
  }
) {
  return await http.request<CommonResult>(
    "patch",
    baseUrlApi(prefix + `defect-categories/${id}`),
    { data }
  );
}

/** 删除缺陷分类 */
export async function deleteDefectCategoryApi(id: number) {
  return await http.request<CommonResult>(
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
  return await http.request<CommonResult>(
    "get",
    baseUrlApi(prefix + `inspection-records/${index}`),
    { params }
  );
}

/** 创建质检记录 */
export async function createInspectionRecordApi(data: {
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
}) {
  return await http.request<CommonResult>(
    "post",
    baseUrlApi(prefix + "inspection-records"),
    { data }
  );
}

/** 获取质检记录详情 */
export async function getInspectionRecordApi(id: string) {
  return await http.request<CommonResult>(
    "get",
    baseUrlApi(prefix + `inspection-records/detail/${id}`)
  );
}
