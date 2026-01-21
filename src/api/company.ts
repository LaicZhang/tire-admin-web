import { http } from "@/utils/http";
import { baseUrlApi } from "./utils";
import type { CommonResult } from "./type";
import { useCurrentCompanyStoreHook } from "@/store/modules/company";

const prefix = "/company/";

const cid = getCompanyId();

export function getCompanyId() {
  return useCurrentCompanyStoreHook().companyId;
}

export async function getCompanyListApi(
  index: number,
  params?: Record<string, unknown>
) {
  return await http.request<CommonResult>(
    "get",
    baseUrlApi(prefix + "page/" + index),
    { params }
  );
}

export async function addCompanyApi(data: object) {
  return await http.request<CommonResult>("post", baseUrlApi(prefix), {
    data
  });
}

export async function getCompanyApi(uid: string | number = cid) {
  return await http.request<CommonResult>("get", baseUrlApi(prefix + uid));
}

export async function updateCompanyApi(
  uid: string | number = cid,
  data: object
) {
  return await http.request<CommonResult>("patch", baseUrlApi(prefix + uid), {
    data
  });
}

export async function deleteCompanyApi(uid: number) {
  return await http.request<CommonResult>("delete", baseUrlApi(prefix + uid));
}
