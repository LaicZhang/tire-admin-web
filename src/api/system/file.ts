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
}

export async function getFileListApi(params?: object) {
  return await http.request<CommonResult>("get", baseUrlApi(`${prefix}/list`), {
    params
  });
}

export async function uploadFileApi(data: FormData) {
  return await http.request<CommonResult>(
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
  return await http.request<CommonResult>(
    "delete",
    baseUrlApi(`${prefix}/${id}`)
  );
}
