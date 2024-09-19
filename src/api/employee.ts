import { http } from "../utils/http";
import { baseUrlApi } from "./utils";
import type { CommonResult } from "./type";
import { getCompanyId } from "./company";

const prefix = "/employee/";

const cid = getCompanyId();

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

export async function getEmployeeApi(uid = cid) {
  return await http.request<CommonResult>("get", baseUrlApi(prefix + uid));
}

export async function updateEmployeeApi(uid, data: object) {
  return await http.request<CommonResult>("patch", baseUrlApi(prefix + uid), {
    data
  });
}

export async function deleteEmployeeApi(uid) {
  return await http.request<CommonResult>("delete", baseUrlApi(prefix + uid));
}
