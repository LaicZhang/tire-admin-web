import { http } from "@/utils/http";
import { baseUrlApi } from "../utils";
import type { CommonResult } from "../type";

const prefix = "/system/file";

export interface FileItem {
  id: number;
  fileName: string;
  fileSize: string;
  fileType: string;
  fileUrl: string;
  createTime: string;
  deleteTime?: string;
}

export interface FileListQuery {
  page?: number;
  limit?: number;
  fileName?: string;
  fileType?: string;
  scope?: "nonDeleted" | "deleted" | "all";
}

export async function getFileListApi(params?: FileListQuery) {
  return await http.request<CommonResult<{ list: FileItem[]; total: number }>>(
    "get",
    baseUrlApi(`${prefix}/list`),
    { params }
  );
}

export async function uploadFileApi(data: FormData) {
  return await http.request<CommonResult<FileItem>>(
    "post",
    baseUrlApi(`${prefix}/upload`),
    {
      data,
      headers: {
        "Content-Type": "multipart/form-data"
      }
    }
  );
}

export async function deleteFileApi(id: number) {
  return await http.request<CommonResult<void>>(
    "delete",
    baseUrlApi(`${prefix}/${id}`)
  );
}

export async function restoreFileApi(id: number) {
  return await http.request<CommonResult<FileItem>>(
    "post",
    baseUrlApi(`${prefix}/${id}/restore`)
  );
}
