import { http } from "../utils/http";
import { baseUrlApi } from "./utils";
import type { CommonResult } from "./type";

const prefix = "/repo/";

export async function getRepoListApi(index: number, params?: Object) {
  return await http.request<CommonResult>(
    "get",
    baseUrlApi(prefix + "page/" + index),
    { params }
  );
}

export async function addRepoApi(data: Object) {
  return await http.request<CommonResult>("post", baseUrlApi(prefix), {
    data
  });
}

export async function getRepoApi(uid) {
  return await http.request<CommonResult>("get", baseUrlApi(prefix + uid));
}

export async function updateRepoApi(uid, data: Object) {
  return await http.request<CommonResult>("patch", baseUrlApi(prefix + uid), {
    data
  });
}

export async function toggleRepoApi(uid) {
  const repo = await getRepoApi(uid);
  if (repo.data.status === true)
    return await updateRepoApi(uid, { status: false });
  else return await updateRepoApi(uid, { status: true });
}

export async function deleteRepoApi(uid) {
  return await http.request<CommonResult>("delete", baseUrlApi(prefix + uid));
}
