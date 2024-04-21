import { http } from "@/utils/http";
import { baseUrlApi } from "./utils";
import type { CommonResult } from "./type";

const prefix = "/company";

export function getCompanyListApi(index: number, params?: Object) {
  return http.request<CommonResult>(
    "get",
    baseUrlApi(prefix + "/page/" + index),
    { params }
  );
}

export function addCompanyApi(data: Object) {
  return http.request<CommonResult>("post", baseUrlApi(prefix), {
    data
  });
}

export function getCompanyApi(uid: string) {
  return http.request<CommonResult>("get", baseUrlApi(prefix + "/" + uid));
}

export function updateCompanyApi(uid: string, data: Object) {
  return http.request<CommonResult>("patch", baseUrlApi(prefix + "/" + uid), {
    data
  });
}

export function deleteCompanyApi(uid: number) {
  return http.request<CommonResult>("delete", baseUrlApi(prefix + "/" + uid));
}
