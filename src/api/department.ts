import { http } from "../utils/http";
import { baseUrlApi } from "./utils";
import type { CommonResult } from "./type";
import { getCompanyId } from "./company";

const prefix = "/department/";

const cid = getCompanyId();

export async function getDepartmentListApi(index: number, params?: object) {
  return await http.request<CommonResult>(
    "get",
    baseUrlApi(prefix + "page/" + index),
    { params }
  );
}

export async function addDepartmentApi(data: object) {
  return await http.request<CommonResult>("post", baseUrlApi(prefix), {
    data
  });
}

export async function getDepartmentApi(uid = cid) {
  return await http.request<CommonResult>("get", baseUrlApi(prefix + uid));
}

export async function updateDepartmentApi(uid, data: object) {
  return await http.request<CommonResult>("patch", baseUrlApi(prefix + uid), {
    data
  });
}

export async function deleteDepartmentApi(uid) {
  return await http.request<CommonResult>("delete", baseUrlApi(prefix + uid));
}

export async function getDepartmentWithEmpApi() {
  return await http.request<CommonResult>(
    "get",
    baseUrlApi(prefix + "with-employee")
  );
}
