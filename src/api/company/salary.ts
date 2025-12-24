import { http } from "../../utils/http";
import { baseUrlApi } from "../utils";
import type { CommonResult } from "../type";

const prefix = "/salary/";

export async function getSalaryListApi(index: number, params?: object) {
  return await http.request<CommonResult>(
    "get",
    baseUrlApi(prefix + "page/" + index),
    { params }
  );
}

export async function addSalaryApi(data: object) {
  return await http.request<CommonResult>("post", baseUrlApi(prefix), {
    data
  });
}

export async function getSalaryApi(uid: string) {
  return await http.request<CommonResult>("get", baseUrlApi(prefix + uid));
}

export async function updateSalaryApi(uid: string, data: object) {
  return await http.request<CommonResult>("patch", baseUrlApi(prefix + uid), {
    data
  });
}

export async function deleteSalaryApi(uid: string) {
  return await http.request<CommonResult>("delete", baseUrlApi(prefix + uid));
}
