import { http } from "@/utils/http";
import { baseUrlApi } from "./utils";
import type { CommonResult } from "./type";
import { useCurrentCompanyStoreHook } from "@/store/modules/company";

const prefix = "/company/";

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

export async function getCompanyApi(uid: string = getCompanyId()) {
  return await http.request<CommonResult>("get", baseUrlApi(prefix + uid));
}

export async function updateCompanyApi(
  uid: string = getCompanyId(),
  data: object
) {
  return await http.request<CommonResult>("patch", baseUrlApi(prefix + uid), {
    data
  });
}

export async function restoreCompanyApi(uid: string) {
  return await http.request<CommonResult>(
    "post",
    baseUrlApi(prefix + uid + "/restore")
  );
}

export async function deleteCompanyApi(uid: string) {
  return await http.request<CommonResult>("delete", baseUrlApi(prefix + uid));
}
