import { http } from "@/utils/http";
import { baseUrlApi } from "./utils";
import type { CommonResult } from "./type";
import { useCurrentCompanyStoreHook } from "@/store/modules/company";

const prefix = "/company/";

const cid = getCompanyId();

export async function getCompanyId() {
  return await useCurrentCompanyStoreHook().companyId;
}

export function getCompanyListApi(index: number, params?: Object) {
  return http.request<CommonResult>(
    "get",
    baseUrlApi(prefix + "page/" + index),
    { params }
  );
}

export function addCompanyApi(data: Object) {
  return http.request<CommonResult>("post", baseUrlApi(prefix), {
    data
  });
}

export function getCompanyApi(uid = cid) {
  return http.request<CommonResult>("get", baseUrlApi(prefix + uid));
}

export function updateCompanyApi(uid = cid, data: Object) {
  return http.request<CommonResult>("patch", baseUrlApi(prefix + uid), {
    data
  });
}

export function deleteCompanyApi(uid: number) {
  return http.request<CommonResult>("delete", baseUrlApi(prefix + uid));
}
