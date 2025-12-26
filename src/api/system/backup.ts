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
  }>("get", `/api/backup/page/${index}`);
};

// 创建备份
export const createBackupApi = () => {
  return http.request<{ data: BackupTask; code: number }>(
    "post",
    "/api/backup/create"
  );
};

// 下载备份
export const downloadBackupApi = (uid: string) => {
  return http.request<Blob>("get", `/api/backup/download/${uid}`, {
    responseType: "blob"
  });
};

// 恢复备份
export const restoreBackupApi = (uid: string) => {
  return http.request<{ data: BackupTask; code: number }>(
    "post",
    `/api/backup/restore/${uid}`
  );
};

// 删除备份
export const deleteBackupApi = (uid: string) => {
  return http.request<{ data: any; code: number }>(
    "delete",
    `/api/backup/${uid}`
  );
};
