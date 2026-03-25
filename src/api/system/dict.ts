import { http } from "../../utils/http";
import { baseUrlApi } from "../utils";
import type { CommonResult, PaginatedResponseDto } from "../type";

const prefix = "/dict/";

export type DictDataSource = "system" | "company";

export interface DictItem {
  id: number;
  name: string; // 字典类型名称
  key?: number; // 字典项键值
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
export type DictListParams = Record<string, unknown> & {
  type?: DictDataSource;
};

export async function getDictListApi(index: number, params?: DictListParams) {
  return await http.request<CommonResult<PaginatedResponseDto<DictItem>>>(
    "get",
    baseUrlApi(prefix + "page/" + index),
    { params }
  );
}

export async function getDictItemsApi(params?: DictListParams) {
  return await http.request<CommonResult<DictItem[]>>(
    "get",
    baseUrlApi(prefix + "list"),
    { params }
  );
}

export async function createDictApi(data: DictDto & { type?: DictDataSource }) {
  return await http.request<CommonResult<DictItem>>(
    "post",
    baseUrlApi(prefix),
    { data }
  );
}

export async function updateDictApi(
  id: number,
  data: Partial<DictDto> & { type?: DictDataSource }
) {
  return await http.request<CommonResult<DictItem>>(
    "patch",
    baseUrlApi(prefix + id),
    { data }
  );
}

export async function deleteDictApi(
  id: number,
  params?: { type?: DictDataSource }
) {
  return await http.request<CommonResult<void>>(
    "delete",
    baseUrlApi(prefix + id),
    { params }
  );
}

export async function restoreDictApi(
  id: number,
  params?: { type?: DictDataSource }
) {
  return await http.request<CommonResult<DictItem>>(
    "post",
    baseUrlApi(prefix + id + "/restore"),
    { params }
  );
}
