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

export async function getStorageZoneListApi(params?: object) {
  return await http.request<CommonResult>("get", baseUrlApi(zonePrefix), {
    params
  });
}

// 货位
export async function createStorageLocationApi(data: object) {
  return await http.request<CommonResult>("post", baseUrlApi(locationPrefix), {
    data
  });
}

export async function getStorageLocationListApi(params?: object) {
  return await http.request<CommonResult>("get", baseUrlApi(locationPrefix), {
    params
  });
}
