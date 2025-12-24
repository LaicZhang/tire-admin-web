import { http } from "../../utils/http";
import { baseUrlApi } from "../utils";
import type { CommonResult } from "../type";

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

export async function getProviderListApi(
  index: number,
  params?: ProviderQueryDto
) {
  return await http.request<CommonResult>(
    "get",
    baseUrlApi(prefix + "page/" + index),
    { params }
  );
}

export async function addProviderApi(data: ProviderDto) {
  return await http.request<CommonResult>("post", baseUrlApi(prefix), {
    data
  });
}

export async function getProviderApi(uid: string) {
  return await http.request<CommonResult>("get", baseUrlApi(prefix + uid));
}

export async function updateProviderApi(
  uid: string,
  data: Partial<ProviderDto>
) {
  return await http.request<CommonResult>("patch", baseUrlApi(prefix + uid), {
    data
  });
}

export async function deleteProviderApi(uid: string) {
  return await http.request<CommonResult>("delete", baseUrlApi(prefix + uid));
}

export async function getProviderCountApi() {
  return await http.request<CommonResult>("get", baseUrlApi(prefix + "count"));
}

export async function migrateProviderApi(uid: string, data: { uid: string }) {
  return await http.request<CommonResult>(
    "patch",
    baseUrlApi(prefix + "migrate/" + uid),
    { data }
  );
}
