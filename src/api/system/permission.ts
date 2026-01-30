import { http } from "@/utils/http";
import { baseUrlApi } from "../utils";
import type { CommonResult } from "../type";

const prefix = "/permission/";

export interface PermissionDto {
  uid?: string;
  type?: string | null;
  module?: string | null;
  path: string;
  desc?: string | null;
  belong?: number | null;
  deleteAt?: string | null;
}

export interface PermissionListResult {
  list: PermissionDto[];
  count: number;
}

export const getPermissionsApi = (
  index: number,
  params?: Record<string, unknown>
) => {
  return http.request<CommonResult<PermissionListResult>>(
    "get",
    baseUrlApi(`${prefix}page/${index}`),
    { params }
  );
};

export const createPermissionApi = (data: Partial<PermissionDto>) => {
  return http.request<CommonResult<PermissionDto>>("post", baseUrlApi(prefix), {
    data
  });
};

export const updatePermissionApi = (
  uid: string,
  data: Partial<PermissionDto>
) => {
  return http.request<CommonResult<PermissionDto>>(
    "patch",
    baseUrlApi(`${prefix}${uid}`),
    { data }
  );
};

export const deletePermissionApi = (uid: string) => {
  return http.request<CommonResult<void>>(
    "delete",
    baseUrlApi(`${prefix}${uid}`)
  );
};

export const restorePermissionApi = (uid: string) => {
  return http.request<CommonResult<void>>(
    "post",
    baseUrlApi(`${prefix}${uid}/restore`)
  );
};

export const getPermissionApi = (uid: string) => {
  return http.request<CommonResult<PermissionDto>>(
    "get",
    baseUrlApi(`${prefix}${uid}`)
  );
};
