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

type ExportContent = {
  format: string;
  content: string;
};

function dataUrlToBlob(dataUrl: string): Blob {
  const [meta, base64] = dataUrl.split(",");
  const mime =
    meta?.match(/data:(.*?);base64/i)?.[1] ?? "application/octet-stream";
  const binary = atob(base64 || "");
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return new Blob([bytes], { type: mime });
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

export interface ParsedSheetInfo {
  name: string;
  index: number;
  rowCount: number;
}

export interface ParsedImportSheetsResult {
  sheets: ParsedSheetInfo[];
}

export interface ParsedImportColumn {
  index: number;
  name: string;
  sampleValues: string[];
}

export interface ParsedImportColumnsResult {
  columns: ParsedImportColumn[];
}

export interface ImportPreviewRowError {
  field: string;
  message: string;
  severity: "warning" | "error";
}

export interface ImportPreviewRow {
  rowIndex: number;
  data: Record<string, unknown>;
  errors: ImportPreviewRowError[];
  status: "valid" | "warning" | "error";
}

export interface ImportPreviewResult {
  rows: ImportPreviewRow[];
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

// ============ smartImport 文件解析 ============

/** 解析导入文件的 Sheet 列表（smartImport） */
export async function parseImportSheetsApi(data: FormData) {
  return await http.request<CommonResult<ParsedImportSheetsResult>>(
    "post",
    baseUrlApi(prefix + "import/parse/sheets"),
    {
      data,
      headers: { "Content-Type": "multipart/form-data" }
    }
  );
}

/** 解析导入文件的列信息（smartImport） */
export async function parseImportColumnsApi(data: FormData) {
  return await http.request<CommonResult<ParsedImportColumnsResult>>(
    "post",
    baseUrlApi(prefix + "import/parse/columns"),
    {
      data,
      headers: { "Content-Type": "multipart/form-data" }
    }
  );
}

/** 预览并校验导入数据（smartImport） */
export async function previewImportApi(data: FormData) {
  return await http.request<CommonResult<ImportPreviewResult>>(
    "post",
    baseUrlApi(prefix + "import/preview"),
    {
      data,
      headers: { "Content-Type": "multipart/form-data" }
    }
  );
}

// ============ 数据导出 ============

/** 同步导出数据 */
export async function exportDataApi(
  type: string,
  params?: { ids?: string[]; filters?: object }
) {
  const filterPayload = {
    ...(params?.filters ? { ...(params.filters as object) } : {}),
    ...(params?.ids ? { ids: params.ids } : {})
  };
  const filter = JSON.stringify(filterPayload);

  const res = await http.request<CommonResult<ExportContent>>(
    "get",
    baseUrlApi(prefix + `export/${type}`),
    { params: { type, filter } }
  );
  if (res.code !== 200) throw new Error(res.msg || "导出失败");
  return dataUrlToBlob(res.data?.content || "");
}

/** 创建异步导出任务 */
export async function createAsyncExportTaskApi(
  type: string,
  data: { filters?: object; fields?: string[] }
) {
  const filter = JSON.stringify({
    ...(data.filters ? { filters: data.filters } : {}),
    ...(data.fields ? { fields: data.fields } : {})
  });
  const res = await http.request<
    CommonResult<{
      id: string;
      status: string;
      progress: number;
      error?: string;
    }>
  >("post", baseUrlApi(prefix + `export/async/${type}`), {
    params: { type, filter }
  });
  return {
    ...res,
    data: res.data
      ? ({
          taskId: res.data.id,
          status: res.data.status,
          progress: res.data.progress,
          error: res.data.error
        } as ExportTask)
      : (res.data as ExportTask)
  };
}

/** 查询导出任务状态 */
export async function getExportTaskStatusApi(taskId: string) {
  const res = await http.request<
    CommonResult<{
      id: string;
      status: string;
      progress: number;
      error?: string;
    }>
  >("get", baseUrlApi(prefix + `export/task/${taskId}`));
  return {
    ...res,
    data: res.data
      ? ({
          taskId: res.data.id,
          status: res.data.status,
          progress: res.data.progress,
          error: res.data.error
        } as ExportTask)
      : (res.data as ExportTask)
  };
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
