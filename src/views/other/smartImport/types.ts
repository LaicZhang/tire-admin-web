// 智能匹配导入模块类型定义

/** 上传文件信息 */
export interface UploadedFile {
  uid: string;
  name: string;
  size: number;
  type: string;
  status: "ready" | "uploading" | "success" | "error";
  raw?: File;
}

/** Sheet页信息 */
export interface SheetInfo {
  name: string;
  index: number;
  rowCount: number;
}

/** 原始列信息 */
export interface SourceColumn {
  index: number;
  name: string;
  sampleValues: string[];
}

/** 系统目标字段 */
export interface TargetField {
  key: string;
  label: string;
  required: boolean;
  type: "string" | "number" | "date" | "boolean";
  description?: string;
}

/** 字段映射关系 */
export interface FieldMapping {
  sourceColumn: SourceColumn;
  targetField: TargetField | null;
  confidence: number; // 0-100 匹配置信度
  isManual: boolean; // 是否手动指定
}

/** 导入数据行 */
export interface ImportDataRow {
  rowIndex: number;
  data: Record<string, unknown>;
  errors: RowError[];
  status: "valid" | "warning" | "error";
}

/** 行错误信息 */
export interface RowError {
  field: string;
  message: string;
  severity: "warning" | "error";
}

/** 导入验证结果 */
export interface ValidationResult {
  valid: boolean;
  totalRows: number;
  validRows: number;
  warningRows: number;
  errorRows: number;
  errors: ValidationError[];
}

/** 验证错误详情 */
export interface ValidationError {
  row: number;
  field: string;
  value: unknown;
  message: string;
  severity: "warning" | "error";
}

/** 导入进度 */
export interface ImportProgress {
  current: number;
  total: number;
  status:
    | "idle"
    | "parsing"
    | "mapping"
    | "validating"
    | "importing"
    | "completed"
    | "error";
  message?: string;
}

/** 导入结果 */
export interface ImportResult {
  success: boolean;
  total: number;
  successCount: number;
  failedCount: number;
  errors?: Array<{ row: number; message: string }>;
  createdRecords?: string[];
}

/** 导入类型选项 */
export interface ImportTypeOption {
  value: string;
  label: string;
  targetFields: TargetField[];
}

/** 导入步骤 */
export enum ImportStep {
  UPLOAD = 0,
  SELECT_SHEET = 1,
  FIELD_MAPPING = 2,
  PREVIEW = 3,
  IMPORTING = 4,
  RESULT = 5
}

/** 导入步骤名称映射 */
export const importStepNames: Record<ImportStep, string> = {
  [ImportStep.UPLOAD]: "上传文件",
  [ImportStep.SELECT_SHEET]: "选择Sheet",
  [ImportStep.FIELD_MAPPING]: "字段映射",
  [ImportStep.PREVIEW]: "预览数据",
  [ImportStep.IMPORTING]: "导入中",
  [ImportStep.RESULT]: "导入结果"
};

/** 导入配置 */
export interface ImportConfig {
  type: string;
  skipEmptyRows: boolean;
  headerRow: number;
  startDataRow: number;
  dateFormat: string;
  duplicateStrategy: "skip" | "update" | "error";
}

/** 默认导入配置 */
export const defaultImportConfig: ImportConfig = {
  type: "",
  skipEmptyRows: true,
  headerRow: 1,
  startDataRow: 2,
  dateFormat: "YYYY-MM-DD",
  duplicateStrategy: "skip"
};
