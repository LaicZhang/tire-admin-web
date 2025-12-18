import { http } from "@/utils/http";
import { baseUrlApi } from "../utils";
import type { CommonResult } from "../type";

const prefix = "/system/notice";

export interface NoticeItem {
  id: number;
  title: string;
  type: number; // 1: Notice, 2: Announcement
  content: string;
  status: boolean;
  createTime: string;
}

export async function getNoticeListApi(params?: object) {
  return await http.request<CommonResult>("get", baseUrlApi(`${prefix}/list`), {
    params
  });
}

export async function createNoticeApi(data: object) {
  return await http.request<CommonResult>("post", baseUrlApi(prefix), {
    data
  });
}

export async function updateNoticeApi(id: number, data: object) {
  return await http.request<CommonResult>(
    "put",
    baseUrlApi(`${prefix}/${id}`),
    {
      data
    }
  );
}

export async function deleteNoticeApi(id: number) {
  return await http.request<CommonResult>(
    "delete",
    baseUrlApi(`${prefix}/${id}`)
  );
}
