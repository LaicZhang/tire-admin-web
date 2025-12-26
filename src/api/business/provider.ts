import { http } from "../../utils/http";
import { baseUrlApi } from "../utils";
import type {
  CommonResult,
  PaginatedResponseDto,
  CountResponseDto
} from "../type";

const prefix = "/provider/";

/** 供应商查询参数 */
export interface ProviderQueryDto {
  keyword?: string;
}

/** 供应商创建/更新 DTO */
export interface ProviderDto {
  name: string;
  phone?: string;
  address?: string;
  bankInfo?: string;
  desc?: string;
}

/** 供应商实体 */
export interface Provider extends ProviderDto {
  id: number;
  uid: string;
}

export async function getProviderListApi(
  index: number,
  params?: ProviderQueryDto
) {
  return await http.request<CommonResult<PaginatedResponseDto<Provider>>>(
    "get",
    baseUrlApi(prefix + "page/" + index),
    { params }
  );
}

export async function addProviderApi(data: Record<string, unknown>) {
  return await http.request<CommonResult<Provider>>(
    "post",
    baseUrlApi(prefix),
    {
      data
    }
  );
}

export async function getProviderApi(uid: string) {
  return await http.request<CommonResult<Provider>>(
    "get",
    baseUrlApi(prefix + uid)
  );
}

export async function updateProviderApi(
  uid: string,
  data: Record<string, unknown>
) {
  return await http.request<CommonResult<Provider>>(
    "patch",
    baseUrlApi(prefix + uid),
    {
      data
    }
  );
}

export async function deleteProviderApi(uid: string) {
  return await http.request<CommonResult<void>>(
    "delete",
    baseUrlApi(prefix + uid)
  );
}

export async function getProviderCountApi() {
  return await http.request<CommonResult<CountResponseDto>>(
    "get",
    baseUrlApi(prefix + "count")
  );
}

export async function migrateProviderApi(uid: string, data: { uid: string }) {
  return await http.request<CommonResult<void>>(
    "patch",
    baseUrlApi(prefix + "migrate/" + uid),
    { data }
  );
}
