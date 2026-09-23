import { http } from "../../utils/http";
import { baseUrlApi } from "../utils";
import type { CommonResult } from "../type";
import { unsupportedBackendRoute } from "../route-gap";

const zonePrefix = "/storage-zone";
const locationPrefix = "/storage-location";

export async function createStorageZoneApi(data: object) {
  return await http.request<CommonResult>("post", baseUrlApi(zonePrefix), {
    data
  });
}

export async function getStorageZoneListApi(params?: Record<string, unknown>) {
  return await http.request<CommonResult>("get", baseUrlApi(zonePrefix), {
    params
  });
}

/** 后端没有 GET /storage-zone/:uid。 */
export async function getStorageZoneApi(_uid: string) {
  return unsupportedBackendRoute("GET /storage-zone/:uid");
}

/** 后端没有 PATCH /storage-zone/:uid。 */
export async function updateStorageZoneApi(_uid: string, _data: object) {
  return unsupportedBackendRoute("PATCH /storage-zone/:uid");
}

/** 后端没有 DELETE /storage-zone/:uid。 */
export async function deleteStorageZoneApi(_uid: string) {
  return unsupportedBackendRoute("DELETE /storage-zone/:uid");
}

export async function createStorageLocationApi(data: object) {
  return await http.request<CommonResult>("post", baseUrlApi(locationPrefix), {
    data
  });
}

export async function getStorageLocationListApi(
  params?: Record<string, unknown>
) {
  return await http.request<CommonResult>("get", baseUrlApi(locationPrefix), {
    params
  });
}
