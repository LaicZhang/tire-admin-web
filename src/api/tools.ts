import { http } from "../utils/http";
import { baseUrlApi } from "./utils";
import type { CommonResult } from "./type";
import type { AxiosProgressEvent } from "axios";

const prefix = "/tools/";

export interface ImportTemplate {
  type: string;
  name: string;
  fields: Array<{ name: string; label: string; required: boolean }>;
}

export interface ImportResult {
  total: number;
  success: number;
  failed: number;
  errors?: Array<{ row: number; message: string }>;
}

export interface ExportTask {
  taskId: string;
  status: "pending" | "processing" | "completed" | "failed";
  progress?: number;
  downloadUrl?: string;
  error?: string;
}

export interface PrintTemplate {
  type: string;
  name: string;
  template: string;
}

export interface BarcodeProduct {
  uid?: string;
  code: string;
  name: string;
  price?: number;
  stock?: number;
}

// ============ 导入模板 ============

/** 获取导入模板定义 */
export async function getImportTemplateApi(type: string) {
  return await http.request<CommonResult<ImportTemplate>>(
    "get",
    baseUrlApi(prefix + `import/template/${type}`)
  );
}

/** 下载导入模板Excel文件 */
export async function downloadImportTemplateApi(type: string) {
  return await http.request<Blob>(
    "get",
    baseUrlApi(prefix + `import/template/${type}/download`),
    { responseType: "blob" }
  );
}

// ============ 数据导入 ============

/** 批量导入数据 */
export async function importDataApi(
  type: string,
  data: FormData,
  onProgress?: (progress: number) => void
) {
  return await http.request<CommonResult<ImportResult>>(
    "post",
    baseUrlApi(prefix + `import/${type}`),
    {
      data,
      headers: { "Content-Type": "multipart/form-data" },
      onUploadProgress: (progressEvent: AxiosProgressEvent) => {
        if (onProgress && progressEvent.total) {
          const progress = Math.round(
            (progressEvent.loaded * 100) / progressEvent.total
          );
          onProgress(progress);
        }
      }
    }
  );
}

// ============ 数据导出 ============

/** 同步导出数据 */
export async function exportDataApi(
  type: string,
  params?: { ids?: string[]; filters?: object }
) {
  return await http.request<Blob>(
    "get",
    baseUrlApi(prefix + `export/${type}`),
    { params, responseType: "blob" }
  );
}

/** 创建异步导出任务 */
export async function createAsyncExportTaskApi(
  type: string,
  data: { filters?: object; fields?: string[] }
) {
  return await http.request<CommonResult<ExportTask>>(
    "post",
    baseUrlApi(prefix + `export/async/${type}`),
    { data }
  );
}

/** 查询导出任务状态 */
export async function getExportTaskStatusApi(taskId: string) {
  return await http.request<CommonResult<ExportTask>>(
    "get",
    baseUrlApi(prefix + `export/task/${taskId}`)
  );
}

/** 下载导出文件 */
export async function downloadExportFileApi(taskId: string) {
  return await http.request<Blob>(
    "get",
    baseUrlApi(prefix + `export/download/${taskId}`),
    { responseType: "blob" }
  );
}

// ============ 条码服务 ============

/** 生成条码图片 */
export async function generateBarcodeApi(params: {
  code: string;
  type?: "code128" | "qrcode";
  width?: number;
  height?: number;
}) {
  return await http.request<Blob>("get", baseUrlApi(prefix + "barcode"), {
    params,
    responseType: "blob"
  });
}

/** 扫码查询商品 */
export async function scanBarcodeApi(code: string) {
  return await http.request<CommonResult<BarcodeProduct>>(
    "get",
    baseUrlApi(prefix + `barcode/scan/${code}`)
  );
}

// ============ 打印服务 ============

/** 获取打印模板 */
export async function getPrintTemplateApi(type: string) {
  return await http.request<CommonResult<PrintTemplate>>(
    "get",
    baseUrlApi(prefix + `print/template/${type}`)
  );
}

/** 保存打印模板 */
export async function savePrintTemplateApi(data: {
  type: string;
  template: string;
}) {
  return await http.request<CommonResult<PrintTemplate>>(
    "post",
    baseUrlApi(prefix + "print/template"),
    { data }
  );
}
