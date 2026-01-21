import { http } from "@/utils/http";
import { baseUrlApi } from "../utils";
import type { CommonResult } from "../type";

const recyclePrefix = "/recycle/";

export async function getRecycleListApi(
  page: number,
  params?: { type?: string; keyword?: string }
) {
  return await http.request<CommonResult>(
    "get",
    baseUrlApi(recyclePrefix + "page/" + page),
    { params }
  );
}

export async function restoreRecycleItemApi(uid: string) {
  return await http.request<CommonResult>(
    "post",
    baseUrlApi(recyclePrefix + uid + "/restore")
  );
}

export async function permanentDeleteApi(uid: string) {
  return await http.request<CommonResult>(
    "delete",
    baseUrlApi(recyclePrefix + uid + "/permanent")
  );
}

export async function batchRestoreApi(uids: string[]) {
  return await http.request<CommonResult>(
    "post",
    baseUrlApi(recyclePrefix + "batch-restore"),
    { data: { uids } }
  );
}

export async function batchPermanentDeleteApi(uids: string[]) {
  return await http.request<CommonResult>(
    "delete",
    baseUrlApi(recyclePrefix + "batch-permanent"),
    { data: { uids } }
  );
}
