import { http } from "../../utils/http";
import { baseUrlApi } from "../utils";
import type { CommonResult, PaginatedResponseDto } from "../type";
import { unsupportedBackendRoute, withListTotal } from "../route-gap";

export interface ZoneDto {
  name: string;
  repoId: string;
  desc?: string;
}

export interface Zone extends ZoneDto {
  id: number;
  uid: string;
}

export interface BinDto {
  name: string;
  zoneId: string;
  desc?: string;
}

export interface Bin extends BinDto {
  id: number;
  uid: string;
  isLocked?: boolean;
}

/** 库区查询参数 */
export interface ZoneQuery {
  repoId?: string;
  name?: string;
  keyword?: string;
}

/** 货位查询参数 */
export interface BinQuery {
  zoneId?: string;
  name?: string;
  keyword?: string;
  isLocked?: boolean;
}

/** 库区 API。后端只有 POST/GET /storage-zone，列表用 query `index`。 */
export async function getRepoZoneListApi(index: number, params?: ZoneQuery) {
  const result = await http.request<
    CommonResult<PaginatedResponseDto<Zone> & { count?: number }>
  >("get", baseUrlApi("/storage-zone"), {
    params: { ...params, index }
  });
  return withListTotal(result);
}

export async function createRepoZoneApi(data: ZoneDto) {
  return await http.request<CommonResult<Zone>>(
    "post",
    baseUrlApi("/storage-zone"),
    { data }
  );
}

/** 后端没有 DELETE /storage-zone/:uid。 */
export async function deleteRepoZoneApi(_id: string) {
  return unsupportedBackendRoute("DELETE /storage-zone/:uid");
}

/** 货位 API。后端列表是 GET /storage-location?index=。 */
export async function getRepoBinListApi(index: number, params?: BinQuery) {
  const result = await http.request<
    CommonResult<PaginatedResponseDto<Bin> & { count?: number }>
  >("get", baseUrlApi("/storage-location"), {
    params: { ...params, index }
  });
  return withListTotal(result);
}

/**
 * 零引用。真实创建货位是 POST /storage-location，
 * 请求体为 { repoId, zoneId?, code, desc? }，与旧 BinDto 不同，由调用方自行对齐。
 */
export async function createRepoBinApi(data: BinDto) {
  return await http.request<CommonResult<Bin>>(
    "post",
    baseUrlApi("/storage-location"),
    { data }
  );
}

/** 后端没有 DELETE /storage-location/:uid。 */
export async function deleteRepoBinApi(_id: string) {
  return unsupportedBackendRoute("DELETE /storage-location/:uid");
}

/**
 * 货位锁定不是 reserve-lock（那是订单预留）。后端没有货位锁定路由。
 */
export async function lockRepoBinApi(_data: { id: string; reason: string }) {
  return unsupportedBackendRoute("POST /storage-location/lock");
}

export async function unlockRepoBinApi(_id: string) {
  return unsupportedBackendRoute("POST /storage-location/unlock");
}
