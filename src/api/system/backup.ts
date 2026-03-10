import { http } from "@/utils/http";

export interface BackupTask {
  id: number;
  uid: string;
  companyId: string;
  action: "backup" | "restore";
  status: "pending" | "running" | "success" | "failed";
  fileName?: string;
  filePath?: string;
  fileSize?: number;
  startAt: string;
  finishAt?: string;
  error?: string;
  createdAt: string;
}

// 获取备份列表
export const getBackupListApi = (index: number = 1) => {
  return http.request<{
    data: { count: number; list: BackupTask[] };
    code: number;
  }>("get", `/api/v1/backup/page/${index}`);
};

// 创建备份
export const createBackupApi = () => {
  return http.request<{ data: BackupTask; code: number }>(
    "post",
    "/api/v1/backup/create"
  );
};

// 下载备份
export const downloadBackupApi = (uid: string) => {
  return http.request<Blob>("get", `/api/v1/backup/${uid}/download`, {
    responseType: "blob"
  });
};

// 恢复备份
export const restoreBackupApi = (uid: string) => {
  return http.request<{ data: BackupTask; code: number }>(
    "post",
    `/api/v1/backup/restore/${uid}`
  );
};

// 删除备份
export const deleteBackupApi = (uid: string) => {
  return http.request<{ data: { uid: string }; code: number }>(
    "delete",
    `/api/v1/backup/${uid}`
  );
};
