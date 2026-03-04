import { http } from "@/utils/http";
import { baseUrlApi } from "./utils";
import type { CommonResult } from "./type";
import type { AxiosProgressEvent } from "axios";

const prefix = "/static";

export interface StaticImageEntity {
  id: number;
  uid: string;
  hash: string;
  ext: string;
  mimetype: string;
  size?: number | null;
  width?: number | null;
  height?: number | null;
  filename?: string;
}

export async function checkStaticImageApi(hash: string) {
  return await http.request<CommonResult<StaticImageEntity | null>>(
    "get",
    baseUrlApi(`${prefix}/check/${hash}`)
  );
}

export async function uploadStaticImageApi(
  data: FormData,
  onProgress?: (progress: number) => void
) {
  return await http.request<CommonResult<StaticImageEntity>>(
    "post",
    baseUrlApi(prefix),
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
