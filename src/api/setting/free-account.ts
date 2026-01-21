import { http } from "@/utils/http";
import { baseUrlApi } from "../utils";
import type { CommonResult } from "../type";

const freeAccountPrefix = "/free-account/";

export async function getFreeAccountsApi(params?: {
  accountName?: string;
  companyName?: string;
}) {
  return await http.request<CommonResult>(
    "get",
    baseUrlApi(freeAccountPrefix + "list"),
    {
      params
    }
  );
}

export async function importFreeAccountApi(uid: string) {
  return await http.request<CommonResult>(
    "post",
    baseUrlApi(freeAccountPrefix + uid + "/import")
  );
}

export async function batchImportFreeAccountsApi(uids: string[]) {
  return await http.request<CommonResult>(
    "post",
    baseUrlApi(freeAccountPrefix + "batch-import"),
    { data: { uids } }
  );
}

export async function verifyFreeAccountAuthApi(uid: string, code: string) {
  return await http.request<CommonResult>(
    "post",
    baseUrlApi(freeAccountPrefix + uid + "/verify"),
    { data: { code } }
  );
}
