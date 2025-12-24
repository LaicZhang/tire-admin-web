import { http } from "../../utils/http";
import { baseUrlApi } from "../utils";
import type { CommonResult } from "../type";

const prefix = "/repo/";

export async function getRepoListApi(index: number, params?: object) {
  return await http.request<CommonResult>(
    "get",
    baseUrlApi(prefix + "page/" + index),
    { params }
  );
}

export async function addRepoApi(data: object) {
  return await http.request<CommonResult>("post", baseUrlApi(prefix), {
    data
  });
}

export async function getRepoApi(uid: string) {
  return await http.request<CommonResult>("get", baseUrlApi(prefix + uid));
}

export async function updateRepoApi(uid: string, data: object) {
  return await http.request<CommonResult>("patch", baseUrlApi(prefix + uid), {
    data
  });
}

export async function toggleRepoApi(uid: string) {
  const repo = await getRepoApi(uid);
  const repoData = repo.data as { status?: boolean } | null;
  if (repoData?.status === true)
    return await updateRepoApi(uid, { status: false });
  else return await updateRepoApi(uid, { status: true });
}

export async function deleteRepoApi(uid: string) {
  return await http.request<CommonResult>("delete", baseUrlApi(prefix + uid));
}

/** 启用仓库 */
export async function startRepoApi(uid: string) {
  return await http.request<CommonResult>(
    "patch",
    baseUrlApi(prefix + "start/" + uid)
  );
}

/** 停用仓库 */
export async function stopRepoApi(uid: string) {
  return await http.request<CommonResult>(
    "patch",
    baseUrlApi(prefix + "stop/" + uid)
  );
}

/** 设置为主仓库 */
export async function setDefaultRepoApi(uid: string) {
  return await updateRepoApi(uid, { isPrimary: true });
}
