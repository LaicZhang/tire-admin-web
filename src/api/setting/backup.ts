import { http } from "@/utils/http";
import { baseUrlApi } from "../utils";
import type { CommonResult, PaginatedResponseDto } from "../type";

/** 备份查询参数 */
export interface BackupQuery {
  page?: number;
  pageSize?: number;
  keyword?: string;
  startDate?: string;
  endDate?: string;
}

/** 备份记录 */
export interface BackupRecord {
  uid: string;
  id: number;
  name: string;
  size: number;
  createdAt: string;
  status: "pending" | "completed" | "failed";
  type: "manual" | "auto";
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

export async function getBackupListApi(params?: BackupQuery) {
  return await http.request<CommonResult<PaginatedResponseDto<BackupRecord>>>(
    "get",
    baseUrlApi("/backup/"),
    {
      params
    }
  );
}

export async function createBackupApi(data: { name?: string }) {
  return await http.request<CommonResult<BackupRecord>>(
    "post",
    baseUrlApi("/backup/"),
    {
      data
    }
  );
}

export async function restoreBackupApi(backupId: string) {
  return await http.request<CommonResult<void>>(
    "post",
    baseUrlApi("/backup/" + backupId + "/restore")
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
  return await http.request<CommonResult<void>>(
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
