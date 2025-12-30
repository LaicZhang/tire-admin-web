/** 导入导出任务 */
export interface ImportExportTask {
  id: number;
  uid: string;
  /** 任务类型 */
  type: "import" | "export";
  /** 模块名称 */
  module: string;
  /** 文件名 */
  fileName: string;
  /** 文件大小 */
  fileSize?: number;
  /** 状态 */
  status: "pending" | "processing" | "success" | "failed";
  /** 总行数 */
  totalRows?: number;
  /** 成功行数 */
  successRows?: number;
  /** 失败行数 */
  failedRows?: number;
  /** 错误信息 */
  errorMessage?: string;
  /** 下载链接 */
  downloadUrl?: string;
  /** 创建时间 */
  createdAt: string;
  /** 完成时间 */
  completedAt?: string;
}

/** 导入配置 */
export interface ImportConfig {
  module: string;
  label: string;
  templateUrl: string;
  fields: ImportField[];
}

/** 导入字段 */
export interface ImportField {
  name: string;
  label: string;
  required: boolean;
  type: "string" | "number" | "date" | "boolean";
}

/** 导出配置 */
export interface ExportConfig {
  module: string;
  label: string;
  fields: ExportField[];
}

/** 导出字段 */
export interface ExportField {
  name: string;
  label: string;
  selected: boolean;
}

/** 模块选项 */
export interface ModuleOption {
  label: string;
  value: string;
  templateUrl?: string;
}
