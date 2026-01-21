import { http } from "@/utils/http";
import { baseUrlApi } from "../utils";
import type { CommonResult, PaginatedResponseDto } from "../type";

const prefix = "/system/file";

export interface FileItem {
  id: number;
  fileName: string;
  fileSize: string;
  fileType: string;
  fileUrl: string;
  createTime: string;
}

export async function getFileListApi(params?: Record<string, unknown>) {
  return await http.request<CommonResult<PaginatedResponseDto<FileItem>>>(
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
