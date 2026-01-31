import { http } from "../../utils/http";
import { baseUrlApi } from "../utils";
import type { CommonResult, PaginatedResponseDto } from "../type";

const prefix = "/repo/";

/** Prisma 关联连接类型 */
interface PrismaConnect<T> {
  connect?: T;
  set?: T[];
  disconnect?: T | T[];
}

export interface RepoDto {
  name: string;
  address?: string;
  desc?: string;
  startAt?: string | Date;
  endAt?: string | Date;
  company?: PrismaConnect<{ uid: string }>;
  manager?: PrismaConnect<{ uid: string }>;
  isPrimary?: boolean;
  status?: boolean;
}

export interface Repo {
  id: number;
  uid: string;
  name: string;
  address?: string;
  desc?: string;
  startAt?: string | Date;
  endAt?: string | Date;
  isPrimary?: boolean;
  status?: boolean;
  deleteAt?: string | null;
  manager?: { uid: string; name?: string } | null;
}

export interface RepoQueryDto {
  name?: string;
  desc?: string;
  keyword?: string;
  scope?: "nonDeleted" | "deleted" | "all";
  limit?: number;
  pageSize?: number;
}

export async function getRepoListApi(index: number, params?: RepoQueryDto) {
  return await http.request<CommonResult<PaginatedResponseDto<Repo>>>(
    "get",
    baseUrlApi(prefix + "page/" + index),
    { params }
  );
}

export async function addRepoApi(data: RepoDto) {
  return await http.request<CommonResult<Repo>>("post", baseUrlApi(prefix), {
    data
  });
}

export async function getRepoApi(uid: string) {
  return await http.request<CommonResult<Repo>>(
    "get",
    baseUrlApi(prefix + uid)
  );
}

export async function updateRepoApi(uid: string, data: Partial<RepoDto>) {
  return await http.request<CommonResult<Repo>>(
    "patch",
    baseUrlApi(prefix + uid),
    {
      data
    }
  );
}

export async function toggleRepoApi(uid: string) {
  const repo = await getRepoApi(uid);
  if (repo.data?.status === true)
    return await updateRepoApi(uid, { status: false });
  else return await updateRepoApi(uid, { status: true });
}

export async function deleteRepoApi(uid: string) {
  return await http.request<CommonResult<void>>(
    "delete",
    baseUrlApi(prefix + uid)
  );
}

export async function restoreRepoApi(uid: string) {
  return await http.request<CommonResult<Repo>>(
    "post",
    baseUrlApi(prefix + uid + "/restore")
  );
}

/** 启用仓库 */
export async function startRepoApi(uid: string) {
  return await http.request<CommonResult<Repo>>(
    "patch",
    baseUrlApi(prefix + "start/" + uid)
  );
}

/** 停用仓库 */
export async function stopRepoApi(uid: string) {
  return await http.request<CommonResult<Repo>>(
    "patch",
    baseUrlApi(prefix + "stop/" + uid)
  );
}

/** 设置为主仓库 */
export async function setDefaultRepoApi(uid: string) {
  return await updateRepoApi(uid, { isPrimary: true });
}

/** 批量获取仓库 */
export async function getRepoBatchApi(uids: string[]) {
  return await http.request<CommonResult<Repo[]>>(
    "post",
    baseUrlApi(prefix + "batch"),
    { data: { uids } }
  );
}
