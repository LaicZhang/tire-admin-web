import { http } from "../../utils/http";
import { baseUrlApi } from "../utils";
import type { CommonResult } from "../type";

const zonePrefix = "/storage-zone/";
const locationPrefix = "/storage-location/";

// 库区
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

export async function getStorageZoneApi(uid: string) {
  return await http.request<CommonResult>("get", baseUrlApi(zonePrefix + uid));
}

export async function updateStorageZoneApi(uid: string, data: object) {
  return await http.request<CommonResult>(
    "patch",
    baseUrlApi(zonePrefix + uid),
    {
      data
    }
  );
}

export async function deleteStorageZoneApi(uid: string) {
  return await http.request<CommonResult>(
    "delete",
    baseUrlApi(zonePrefix + uid)
  );
}

// 货位
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
