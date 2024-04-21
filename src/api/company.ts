import { http } from "@/utils/http";
import { baseUrlApi } from "./utils";
import type { CommonResult } from "./type";

const prefix = "/company";

export function getCompanyListApi(params?: Object) {
  return http.request<CommonResult>(
    "get",
    baseUrlApi(prefix + "company/page"),
    { params }
  );
}

export function addCompanyApi(data: Object) {
  return http.request<CommonResult>("post", baseUrlApi(prefix + "company"), {
    data
  });
}

export function getCompanyApi(uid: string) {
  return http.request<CommonResult>(
    "get",
    baseUrlApi(prefix + "company/" + uid)
  );
}

export function updateCompanyApi(data: Object) {
  return http.request<CommonResult>("patch", baseUrlApi(prefix + "company"), {
    data
  });
}

export function deleteCompanyApi(uid: number) {
  return http.request<CommonResult>(
    "delete",
    baseUrlApi(prefix + "company/" + uid)
  );
}
