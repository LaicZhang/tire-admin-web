import { http } from "../../utils/http";
import { baseUrlApi } from "./../utils";
import type { CommonResult } from "./../type";
import { getCompanyId } from "./../company";

const prefix = "/tire-number/";

const cid = getCompanyId();

export async function getTireNumberListApi(index: number, params?: object) {
  return await http.request<CommonResult>(
    "get",
    baseUrlApi(prefix + "page/" + index),
    { params }
  );
}

export async function addTireNumberApi(data: object) {
  return await http.request<CommonResult>("post", baseUrlApi(prefix), {
    data
  });
}

export async function getTireNumberApi(uid = cid) {
  return await http.request<CommonResult>("get", baseUrlApi(prefix + uid));
}

export async function updateTireNumberApi(uid, data: object) {
  return await http.request<CommonResult>("patch", baseUrlApi(prefix + uid), {
    data
  });
}

export async function deleteTireNumberApi(uid) {
  return await http.request<CommonResult>("delete", baseUrlApi(prefix + uid));
}
