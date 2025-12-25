import { http } from "../../utils/http";
import { baseUrlApi } from "../utils";
import type { CommonResult, PaginatedResponseDto } from "../type";

const prefix = "/system/dict/";

export interface DictItem {
  id: number;
  code: string;
  name: string;
  value: string;
  description?: string;
  sort?: number;
}

export interface DictDto {
  code: string;
  name: string;
  value: string;
  description?: string;
  sort?: number;
}

export async function getDictListApi(index: number, params?: object) {
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
