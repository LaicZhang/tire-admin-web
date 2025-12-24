import { http } from "../../utils/http";
import { baseUrlApi } from "../utils";
import type { CommonResult } from "../type";

const prefix = "/employee/";

export async function getAllEmployeeApi(params?: object) {
  return await http.request<CommonResult>("get", baseUrlApi(prefix), {
    params
  });
}

export async function getEmployeeListApi(index: number, params?: object) {
  return await http.request<CommonResult>(
    "get",
    baseUrlApi(prefix + "page/" + index),
    { params }
  );
}

export async function addEmployeeApi(data: object) {
  return await http.request<CommonResult>("post", baseUrlApi(prefix), {
    data
  });
}

export async function getEmployeeApi(uid: string) {
  return await http.request<CommonResult>("get", baseUrlApi(prefix + uid));
}

export async function updateEmployeeApi(uid: string, data: object) {
  return await http.request<CommonResult>("patch", baseUrlApi(prefix + uid), {
    data
  });
}

export async function deleteEmployeeApi(uid: string) {
  return await http.request<CommonResult>("delete", baseUrlApi(prefix + uid));
}

/** 获取员工数量 */
export async function getEmployeeCountApi() {
  return await http.request<CommonResult>("get", baseUrlApi(prefix + "count"));
}
