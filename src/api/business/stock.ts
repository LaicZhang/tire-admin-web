import { http } from "../../utils/http";
import { baseUrlApi } from "../utils";
import type { CommonResult } from "../type";

const prefix = "/stock/";

/** 库区 API */
export async function getRepoZoneListApi(index: number, params?: object) {
  return await http.request<CommonResult>(
    "get",
    baseUrlApi(prefix + "zone/" + index),
    { params }
  );
}

export async function createRepoZoneApi(data: object) {
  return await http.request<CommonResult>("post", baseUrlApi(prefix + "zone"), {
    data
  });
}

export async function deleteRepoZoneApi(id: string) {
  return await http.request<CommonResult>(
    "delete",
    baseUrlApi(prefix + "zone/" + id)
  );
}

/** 货位 API */
export async function getRepoBinListApi(index: number, params?: object) {
  return await http.request<CommonResult>(
    "get",
    baseUrlApi(prefix + "bin/" + index),
    { params }
  );
}

export async function createRepoBinApi(data: object) {
  return await http.request<CommonResult>("post", baseUrlApi(prefix + "bin"), {
    data
  });
}

export async function deleteRepoBinApi(id: string) {
  return await http.request<CommonResult>(
    "delete",
    baseUrlApi(prefix + "bin/" + id)
  );
}

/** 锁定/解锁货位 */
export async function lockRepoBinApi(data: { id: string; reason: string }) {
  return await http.request<CommonResult>(
    "post",
    baseUrlApi(prefix + "bin/lock"),
    {
      data
    }
  );
}

export async function unlockRepoBinApi(id: string) {
  return await http.request<CommonResult>(
    "post",
    baseUrlApi(prefix + "bin/unlock"),
    {
      data: { id }
    }
  );
}
