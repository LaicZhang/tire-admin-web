import { http } from "../../utils/http";
import { baseUrlApi } from "../utils";
import type { CommonResult } from "../type";
const prefix = "/unit/";

export interface Unit {
  id: number;
  uid: string;
  name: string;
  symbol: string;
  companyId: string;
}

export interface UnitConversion {
  id: number;
  uid: string;
  sourceUnitId: string;
  targetUnitId: string;
  ratio: number;
  tireId?: string;
  sourceUnit?: Unit;
  targetUnit?: Unit;
}

export async function getUnitListApi(
  index: number,
  params?: Record<string, unknown>
) {
  return await http.request<CommonResult>(
    "get",
    baseUrlApi(prefix + "page/" + index),
    { params }
  );
}

export async function getAllUnitsApi() {
  return await http.request<{ data: Unit[]; code: number }>(
    "get",
    baseUrlApi(prefix + "all")
  );
}

export async function createUnitApi(data: object) {
  return await http.request<CommonResult>("post", baseUrlApi(prefix), {
    data
  });
}

export async function deleteUnitApi(id: number) {
  return await http.request<CommonResult>("delete", baseUrlApi(prefix + id));
}

export async function updateUnitApi(id: number, data: object) {
  return await http.request<CommonResult>("patch", baseUrlApi(prefix + id), {
    data
  });
}

// 单位换算相关
export async function getUnitConversionsApi(tireId?: string) {
  return await http.request<{ data: UnitConversion[]; code: number }>(
    "get",
    baseUrlApi("/unit-conversion"),
    { params: { tireId } }
  );
}

export async function createUnitConversionApi(data: {
  sourceUnitId: string;
  targetUnitId: string;
  ratio: number;
  tireId?: string;
}) {
  return await http.request<{ data: UnitConversion; code: number }>(
    "post",
    baseUrlApi("/unit-conversion"),
    { data }
  );
}

export async function deleteUnitConversionApi(uid: string) {
  return await http.request<CommonResult>(
    "delete",
    baseUrlApi("/unit-conversion/" + uid)
  );
}
