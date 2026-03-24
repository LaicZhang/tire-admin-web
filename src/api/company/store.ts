import { http } from "../../utils/http";
import { baseUrlApi } from "../utils";
import type { CommonResult, PaginatedResponseDto } from "../type";

const prefix = "/store/";

interface PrismaConnect<T> {
  connect?: T;
}

export interface StoreDto {
  name: string;
  address?: string;
  desc?: string;
  company?: PrismaConnect<{ uid: string }>;
  defaultRepository?: PrismaConnect<{ uid: string }>;
  isPrimary?: boolean;
  status?: boolean;
}

export interface Store {
  id: number;
  uid: string;
  name: string;
  address?: string;
  desc?: string;
  defaultRepositoryId: string;
  isPrimary?: boolean;
  status?: boolean;
  deleteAt?: string | null;
  defaultRepository?: { uid: string; name?: string } | null;
}

export interface StoreQueryDto {
  name?: string;
  desc?: string;
  keyword?: string;
  scope?: "nonDeleted" | "deleted" | "all";
  limit?: number;
  pageSize?: number;
}

export async function getStoreListApi(index: number, params?: StoreQueryDto) {
  return await http.request<CommonResult<PaginatedResponseDto<Store>>>(
    "get",
    baseUrlApi(prefix + "page/" + index),
    { params }
  );
}

export async function addStoreApi(data: StoreDto) {
  return await http.request<CommonResult<Store>>("post", baseUrlApi(prefix), {
    data
  });
}

export async function getStoreApi(uid: string) {
  return await http.request<CommonResult<Store>>(
    "get",
    baseUrlApi(prefix + uid)
  );
}

export async function updateStoreApi(uid: string, data: Partial<StoreDto>) {
  return await http.request<CommonResult<Store>>(
    "patch",
    baseUrlApi(prefix + uid),
    { data }
  );
}

export async function deleteStoreApi(uid: string) {
  return await http.request<CommonResult<void>>(
    "delete",
    baseUrlApi(prefix + uid)
  );
}

export async function restoreStoreApi(uid: string) {
  return await http.request<CommonResult<Store>>(
    "post",
    baseUrlApi(prefix + uid + "/restore")
  );
}

export async function startStoreApi(uid: string) {
  return await http.request<CommonResult<Store>>(
    "patch",
    baseUrlApi(prefix + "start/" + uid)
  );
}

export async function stopStoreApi(uid: string) {
  return await http.request<CommonResult<Store>>(
    "patch",
    baseUrlApi(prefix + "stop/" + uid)
  );
}

export async function setDefaultStoreApi(uid: string) {
  return await updateStoreApi(uid, { isPrimary: true });
}
