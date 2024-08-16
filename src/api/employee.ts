import { http } from "../utils/http";
import { baseUrlApi } from "./utils";
import type { CommonResult } from "./type";
import { getCompanyId } from "./company";

const prefix = "/employee/";

const cid = getCompanyId();

export async function getEmployeeListApi(index: number, params?: Object) {
  return await http.request<CommonResult>(
    "get",
    baseUrlApi(prefix + "page/" + index),
    { params }
  );
}

export async function addEmployeeApi(data: Object) {
  return await http.request<CommonResult>("post", baseUrlApi(prefix), {
    data
  });
}

export async function getEmployeeApi(uid = cid) {
  return await http.request<CommonResult>("get", baseUrlApi(prefix + uid));
}

export async function updateEmployeeApi(uid, data: Object) {
  return await http.request<CommonResult>("patch", baseUrlApi(prefix + uid), {
    data
  });
}

export async function deleteEmployeeApi(uid) {
  return await http.request<CommonResult>("delete", baseUrlApi(prefix + uid));
}
