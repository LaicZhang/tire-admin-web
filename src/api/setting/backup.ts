import { http } from "@/utils/http";
import { baseUrlApi } from "../utils";
import type { CommonResult } from "../type";

export async function getBackupListApi(params?: Record<string, unknown>) {
  return await http.request<CommonResult>("get", baseUrlApi("/backup/"), {
    params
  });
}

export async function createBackupApi(data: object) {
  return await http.request<CommonResult>("post", baseUrlApi("/backup/"), {
    data
  });
}

export async function restoreBackupApi(backupId: string) {
  return await http.request<CommonResult>(
    "post",
    baseUrlApi("/backup/" + backupId + "/restore")
  );
}

export async function downloadBackupApi(backupId: string) {
  return await http.request<CommonResult>(
    "get",
    baseUrlApi("/backup/" + backupId + "/download")
  );
}

export async function deleteBackupApi(backupId: string) {
  return await http.request<CommonResult>(
    "delete",
    baseUrlApi("/backup/" + backupId)
  );
}

export async function updateBackupSettingsApi(data: object) {
  return await http.request<CommonResult>(
    "patch",
    baseUrlApi("/backup/settings"),
    {
      data
    }
  );
}
