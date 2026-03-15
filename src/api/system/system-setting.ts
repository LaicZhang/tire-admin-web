import { http } from "@/utils/http";
import type { CommonResult } from "../type";

export interface SystemSetting {
  id: number;
  uid: string;
  group: string | null;
  key: string;
  value: string | null;
  isPublic: boolean;
  deleteAt?: string | null;
}

export type SystemSettingPage = {
  count: number;
  list: SystemSetting[];
};

export type SystemSettingQuery = {
  group?: string;
  key?: string;
  isPublic?: boolean;
};

export type CreateSystemSettingDto = {
  group?: string | null;
  key: string;
  value?: string | null;
  isPublic?: boolean;
};

export type UpdateSystemSettingDto = {
  value?: string | null;
  isPublic?: boolean;
};

export const getSystemSettingPageApi = (
  page: number,
  params?: SystemSettingQuery
) =>
  http.request<CommonResult<SystemSettingPage>>(
    "get",
    `/api/v1/system/system-setting/page/${page}`,
    { params }
  );

export const createSystemSettingApi = (data: CreateSystemSettingDto) =>
  http.request<CommonResult<SystemSetting>>(
    "post",
    "/api/v1/system/system-setting",
    { data }
  );

export const updateSystemSettingApi = (
  uid: string,
  data: UpdateSystemSettingDto
) =>
  http.request<CommonResult<SystemSetting>>(
    "patch",
    `/api/v1/system/system-setting/${uid}`,
    { data }
  );

export const deleteSystemSettingApi = (uid: string) =>
  http.request<CommonResult<SystemSetting>>(
    "delete",
    `/api/v1/system/system-setting/${uid}`
  );
