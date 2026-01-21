import { http } from "@/utils/http";
import { baseUrlApi } from "../utils";
import type { CommonResult, PaginatedResponseDto } from "../type";

const prefix = "/system/notice";

export interface NoticeItem {
  id: number;
  title: string;
  type: number;
  content: string;
  status: boolean;
  createTime: string;
}

export interface NoticeDto {
  title: string;
  type: number;
  content: string;
  status?: boolean;
}

export async function getNoticeListApi(params?: Record<string, unknown>) {
  return await http.request<CommonResult<PaginatedResponseDto<NoticeItem>>>(
    "get",
    baseUrlApi(`${prefix}/list`),
    { params }
  );
}

export async function createNoticeApi(data: NoticeDto) {
  return await http.request<CommonResult<NoticeItem>>(
    "post",
    baseUrlApi(prefix),
    { data }
  );
}

export async function updateNoticeApi(id: number, data: Partial<NoticeDto>) {
  return await http.request<CommonResult<NoticeItem>>(
    "put",
    baseUrlApi(`${prefix}/${id}`),
    { data }
  );
}

export async function deleteNoticeApi(id: number) {
  return await http.request<CommonResult<void>>(
    "delete",
    baseUrlApi(`${prefix}/${id}`)
  );
}
