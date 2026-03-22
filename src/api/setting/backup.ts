import { http } from "@/utils/http";
import { baseUrlApi } from "../utils";
import type { CommonResult } from "../type";

/** 备份查询参数 */
export interface BackupQuery {
  page?: number;
  pageSize?: number;
  keyword?: string;
  startDate?: string;
  endDate?: string;
}

/** 备份记录 */
export interface BackupTaskRecord {
  uid: string;
  id: number;
  issuerId: string;
  issuerName?: string | null;
  action: "backup" | "restore";
  sourceUid?: string | null;
  fileName: string;
  filePath: string;
  fileSize?: number | null;
  durationMs?: number | null;
  completedAt?: string | null;
  createdAt: string;
  status: "PENDING" | "SUCCESS" | "FAILED" | "RESTORING";
  error?: string | null;
}

/** 备份设置 */
export interface BackupSettings {
  autoBackupEnabled: boolean;
  autoBackupTime: string;
  autoBackupFrequency: "daily" | "weekly" | "monthly";
  autoBackupWeekDay: number;
  autoBackupMonthDay: number;
  keepDays: number;
}

export interface RestoreBackupPayload {
  confirm: true;
  reason: string;
}

export async function getBackupListApi(index = 1, params?: BackupQuery) {
  return await http.request<
    CommonResult<{ count: number; list: BackupTaskRecord[] }>
  >("get", baseUrlApi(`/backup/page/${index}`), {
    params
  });
}

export async function createBackupApi() {
  return await http.request<CommonResult<BackupTaskRecord>>(
    "post",
    baseUrlApi("/backup")
  );
}

export async function uploadBackupApi(data: FormData) {
  return await http.request<CommonResult<BackupTaskRecord>>(
    "post",
    baseUrlApi("/backup/upload"),
    {
      data,
      headers: { "Content-Type": "multipart/form-data" }
    }
  );
}

export async function restoreBackupApi(
  backupId: string,
  data: RestoreBackupPayload
) {
  return await http.request<CommonResult<BackupTaskRecord>>(
    "post",
    baseUrlApi("/backup/" + backupId + "/restore"),
    { data }
  );
}

export async function downloadBackupApi(backupId: string) {
  return await http.request<Blob>(
    "get",
    baseUrlApi("/backup/" + backupId + "/download"),
    {
      responseType: "blob"
    }
  );
}

export async function deleteBackupApi(backupId: string) {
  return await http.request<CommonResult<{ deleted: number }>>(
    "delete",
    baseUrlApi("/backup/" + backupId)
  );
}

export async function getBackupSettingsApi() {
  return await http.request<CommonResult<BackupSettings>>(
    "get",
    baseUrlApi("/backup/settings")
  );
}

export async function updateBackupSettingsApi(data: Partial<BackupSettings>) {
  return await http.request<CommonResult<BackupSettings>>(
    "patch",
    baseUrlApi("/backup/settings"),
    {
      data
    }
  );
}
