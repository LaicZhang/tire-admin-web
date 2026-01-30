import { http } from "../../utils/http";
import { baseUrlApi } from "../utils";
import type { CommonResult, PaginatedResponseDto } from "../type";

const prefix = "/dict/";

export interface DictItem {
  id: number;
  name: string; // 字典类型名称
  key?: number; // 字典项键值（后端由 group 映射得到）
  group?: string | null; // 后端原始字段（兼容）
  cn: string | null; // 中文标签
  en: string | null; // 英文标签
  isPublic?: boolean;
  deleteAt?: string | null;
}

export interface DictDto {
  name: string;
  key: number;
  cn?: string | null;
  en?: string | null;
}

export type DictScope = "nonDeleted" | "deleted" | "all";

export async function getDictListApi(
  index: number,
  params?: Record<string, unknown>
) {
  return await http.request<CommonResult<PaginatedResponseDto<DictItem>>>(
    "get",
    baseUrlApi(prefix + "page/" + index),
    { params }
  );
}

export async function createDictApi(data: DictDto) {
  return await http.request<CommonResult<DictItem>>(
    "post",
    baseUrlApi(prefix),
    { data }
  );
}

export async function updateDictApi(id: number, data: Partial<DictDto>) {
  return await http.request<CommonResult<DictItem>>(
    "patch",
    baseUrlApi(prefix + id),
    { data }
  );
}

export async function deleteDictApi(id: number) {
  return await http.request<CommonResult<void>>(
    "delete",
    baseUrlApi(prefix + id)
  );
}

export async function restoreDictApi(id: number) {
  return await http.request<CommonResult<DictItem>>(
    "post",
    baseUrlApi(prefix + id + "/restore")
  );
}
