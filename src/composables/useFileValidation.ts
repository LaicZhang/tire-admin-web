/**
 * 文件校验 Composable
 * 统一处理文件类型、大小等校验逻辑
 */

import { message } from "@/utils/message";
import type { UploadFile, UploadRawFile } from "element-plus";

/**
 * 文件校验结果
 */
export interface FileValidationResult {
  valid: boolean;
  error?: string;
}

/**
 * 文件类型配置
 */
export interface FileTypeConfig {
  /** 允许的 MIME 类型 */
  mimeTypes?: string[];
  /** 允许的文件扩展名（正则表达式，如 /\.(xlsx|xls|csv)$/i） */
  extensions?: RegExp;
  /** 最大文件大小（字节），默认 10MB */
  maxSize?: number;
  /** 自定义错误消息 */
  errorMessages?: {
    invalidType?: string;
    tooLarge?: string;
  };
}

/**
 * 常用文件类型预设
 */
export const FileTypePresets = {
  /** Excel 文件（.xlsx, .xls） */
  excel: {
    mimeTypes: [
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "application/vnd.ms-excel"
    ],
    extensions: /\.(xlsx|xls)$/i,
    maxSize: 10 * 1024 * 1024, // 10MB
    errorMessages: {
      invalidType: "请上传 Excel 文件（.xlsx 或 .xls）",
      tooLarge: "文件大小不能超过 10MB"
    }
  } as FileTypeConfig,

  /** Excel 和 CSV 文件 */
  excelOrCsv: {
    mimeTypes: [
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "application/vnd.ms-excel",
      "text/csv"
    ],
    extensions: /\.(xlsx|xls|csv)$/i,
    maxSize: 10 * 1024 * 1024, // 10MB
    errorMessages: {
      invalidType: "请上传 Excel 或 CSV 文件",
      tooLarge: "文件大小不能超过 10MB"
    }
  } as FileTypeConfig,

  /** 图片文件 */
  image: {
    mimeTypes: [
      "image/png",
      "image/jpeg",
      "image/jpg",
      "image/gif",
      "image/webp"
    ],
    extensions: /\.(png|jpg|jpeg|gif|webp)$/i,
    maxSize: 10 * 1024 * 1024, // 10MB
    errorMessages: {
      invalidType: "请上传图片文件（PNG、JPG、JPEG、GIF、WEBP）",
      tooLarge: "图片大小不能超过 10MB"
    }
  } as FileTypeConfig,

  /** PDF 文件 */
  pdf: {
    mimeTypes: ["application/pdf"],
    extensions: /\.pdf$/i,
    maxSize: 10 * 1024 * 1024, // 10MB
    errorMessages: {
      invalidType: "请上传 PDF 文件",
      tooLarge: "文件大小不能超过 10MB"
    }
  } as FileTypeConfig,

  /** JSON 文件 */
  json: {
    mimeTypes: ["application/json", "text/json"],
    extensions: /\.json$/i,
    maxSize: 5 * 1024 * 1024, // 5MB
    errorMessages: {
      invalidType: "请上传 JSON 文件",
      tooLarge: "文件大小不能超过 5MB"
    }
  } as FileTypeConfig
};

/**
 * 校验文件类型和大小
 * @param file 文件对象
 * @param config 文件类型配置
 * @param showMessage 是否显示错误消息
 * @returns 校验结果
 */
export function validateFile(
  file: File | UploadRawFile,
  config: FileTypeConfig,
  showMessage: boolean = true
): FileValidationResult {
  // 校验文件类型
  if (config.mimeTypes || config.extensions) {
    let typeValid = false;

    // 检查 MIME 类型
    if (config.mimeTypes && config.mimeTypes.includes(file.type)) {
      typeValid = true;
    }

    // 检查文件扩展名
    if (!typeValid && config.extensions && file.name) {
      typeValid = config.extensions.test(file.name);
    }

    if (!typeValid) {
      const errorMsg = config.errorMessages?.invalidType || "文件类型不支持";
      if (showMessage) {
        message(errorMsg, { type: "warning" });
      }
      return { valid: false, error: errorMsg };
    }
  }

  // 校验文件大小
  const maxSize = config.maxSize ?? 10 * 1024 * 1024; // 默认 10MB
  if (file.size > maxSize) {
    const errorMsg =
      config.errorMessages?.tooLarge ||
      `文件大小不能超过 ${(maxSize / 1024 / 1024).toFixed(0)}MB`;
    if (showMessage) {
      message(errorMsg, { type: "warning" });
    }
    return { valid: false, error: errorMsg };
  }

  return { valid: true };
}

/**
 * 校验 Excel 文件（快捷方法）
 */
export function validateExcelFile(
  file: File | UploadRawFile,
  showMessage: boolean = true
): FileValidationResult {
  return validateFile(file, FileTypePresets.excel, showMessage);
}

/**
 * 校验 Excel 或 CSV 文件（快捷方法）
 */
export function validateExcelOrCsvFile(
  file: File | UploadRawFile,
  showMessage: boolean = true
): FileValidationResult {
  return validateFile(file, FileTypePresets.excelOrCsv, showMessage);
}

/**
 * 校验图片文件（快捷方法）
 */
export function validateImageFile(
  file: File | UploadRawFile,
  maxSize?: number,
  showMessage: boolean = true
): FileValidationResult {
  const config = { ...FileTypePresets.image };
  if (maxSize !== undefined) {
    config.maxSize = maxSize;
  }
  return validateFile(file, config, showMessage);
}

/**
 * ElementPlus Upload 组件的 before-upload 校验函数生成器
 * @param config 文件类型配置
 * @returns before-upload 函数
 */
export function createUploadValidator(config: FileTypeConfig) {
  return (file: UploadRawFile): boolean => {
    const result = validateFile(file, config, true);
    return result.valid;
  };
}

/**
 * ElementPlus Upload 组件的 on-change 校验函数生成器
 * @param config 文件类型配置
 * @param onValid 校验通过时的回调
 * @returns on-change 函数
 */
export function createUploadChangeHandler(
  config: FileTypeConfig,
  onValid?: (file: UploadFile) => void
) {
  return (file: UploadFile): void => {
    if (!file.raw) return;

    const result = validateFile(file.raw, config, true);
    if (result.valid && onValid) {
      onValid(file);
    }
  };
}

/**
 * 格式化文件大小
 * @param bytes 字节数
 * @param decimals 小数位数
 * @returns 格式化后的字符串
 */
export function formatFileSize(bytes: number, decimals: number = 2): string {
  if (bytes === 0) return "0 B";

  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + " " + sizes[i];
}
