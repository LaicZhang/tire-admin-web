// 备份与恢复 - 类型定义
export interface BackupItem {
  uid: string;
  fileName: string;
  fileSize: number;
  fileSizeText: string;
  backupType: "manual" | "auto";
  backupTypeName: string;
  status: "success" | "failed" | "processing";
  statusName: string;
  remark: string;
  createTime: string;
}

export interface BackupSettings {
  autoBackupEnabled: boolean;
  autoBackupTime: string;
  autoBackupFrequency: "daily" | "weekly" | "monthly";
  keepDays: number;
}
