import { http } from "../../utils/http";
import { baseUrlApi } from "../utils";
import type { CommonResult } from "../type";
import { getCompanyId } from "../company";

const prefix = "/salary/";

const cid = getCompanyId();

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

export async function getSalaryApi(uid = cid) {
  return await http.request<CommonResult>("get", baseUrlApi(prefix + uid));
}

export async function updateSalaryApi(uid, data: object) {
  return await http.request<CommonResult>("patch", baseUrlApi(prefix + uid), {
    data
  });
}

export async function deleteSalaryApi(uid) {
  return await http.request<CommonResult>("delete", baseUrlApi(prefix + uid));
}
