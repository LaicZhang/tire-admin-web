import { http } from "../../utils/http";
import { baseUrlApi } from "./../utils";
import type { CommonResult } from "./../type";
import { getCompanyId } from "./../company";

const prefix = "/tire/";

const cid = getCompanyId();

export async function getTireListApi(index: number, params?: object) {
  return await http.request<CommonResult>(
    "get",
    baseUrlApi(prefix + "page/" + index),
    { params }
  );
}

export async function getAllTiresApi() {
  return await http.request<CommonResult>("get", baseUrlApi(prefix + "page/0"));
}

export async function addTireApi(data: object) {
  return await http.request<CommonResult>("post", baseUrlApi(prefix), {
    data
  });
}

export async function getTireApi(uid = cid) {
  return await http.request<CommonResult>("get", baseUrlApi(prefix + uid));
}

export async function updateTireApi(uid, data: object) {
  return await http.request<CommonResult>("patch", baseUrlApi(prefix + uid), {
    data
  });
}

export async function deleteTireApi(uid) {
  return await http.request<CommonResult>("delete", baseUrlApi(prefix + uid));
}
