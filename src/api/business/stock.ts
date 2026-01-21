import { http } from "../../utils/http";
import { baseUrlApi } from "../utils";
import type { CommonResult, PaginatedResponseDto } from "../type";

const prefix = "/stock/";

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

/** 库区 API */
export async function getRepoZoneListApi(
  index: number,
  params?: Record<string, unknown>
) {
  return await http.request<CommonResult<PaginatedResponseDto<Zone>>>(
    "get",
    baseUrlApi(prefix + "zone/" + index),
    { params }
  );
}

export async function createRepoZoneApi(data: ZoneDto) {
  return await http.request<CommonResult<Zone>>(
    "post",
    baseUrlApi(prefix + "zone"),
    {
      data
    }
  );
}

export async function deleteRepoZoneApi(id: string) {
  return await http.request<CommonResult<void>>(
    "delete",
    baseUrlApi(prefix + "zone/" + id)
  );
}

/** 货位 API */
export async function getRepoBinListApi(
  index: number,
  params?: Record<string, unknown>
) {
  return await http.request<CommonResult<PaginatedResponseDto<Bin>>>(
    "get",
    baseUrlApi(prefix + "bin/" + index),
    { params }
  );
}

export async function createRepoBinApi(data: BinDto) {
  return await http.request<CommonResult<Bin>>(
    "post",
    baseUrlApi(prefix + "bin"),
    {
      data
    }
  );
}

export async function deleteRepoBinApi(id: string) {
  return await http.request<CommonResult<void>>(
    "delete",
    baseUrlApi(prefix + "bin/" + id)
  );
}

/** 锁定/解锁货位 */
export async function lockRepoBinApi(data: { id: string; reason: string }) {
  return await http.request<CommonResult<void>>(
    "post",
    baseUrlApi(prefix + "bin/lock"),
    {
      data
    }
  );
}

export async function unlockRepoBinApi(id: string) {
  return await http.request<CommonResult<void>>(
    "post",
    baseUrlApi(prefix + "bin/unlock"),
    {
      data: { id }
    }
  );
}
