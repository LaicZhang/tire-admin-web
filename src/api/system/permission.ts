import { http } from "@/utils/http";
import { baseUrlApi } from "../utils";
import type { CommonResult } from "../type";

const prefix = "/permission";

export interface PermissionItem {
  id?: string;
  name: string; // Permission Name
  code: string; // Permission Code (e.g. system:user:add)
  description?: string;
  type?: number; // 1: Menu, 2: Button, 3: Interface ?
  createTime?: string;
}

export interface PermissionListResult {
  list: PermissionItem[];
  total: number;
  count?: number;
}

export const getPermissionListApi = (params?: object) => {
  return http.request<CommonResult<PermissionListResult>>(
    "get",
    baseUrlApi(`${prefix}/list`),
    {
      params
    }
  );
};

export const createPermissionApi = (data: Partial<PermissionItem>) => {
  return http.request<CommonResult<PermissionItem>>(
    "post",
    baseUrlApi(prefix),
    {
      data
    }
  );
};

export const updatePermissionApi = (
  id: string,
  data: Partial<PermissionItem>
) => {
  return http.request<CommonResult<PermissionItem>>(
    "patch",
    baseUrlApi(`${prefix}/${id}`),
    {
      data
    }
  );
};

export const deletePermissionApi = (id: string) => {
  return http.request<CommonResult<void>>(
    "delete",
    baseUrlApi(`${prefix}/${id}`)
  );
};

/** 获取权限详情 */
export const getPermissionApi = (id: string) => {
  return http.request<CommonResult<PermissionItem>>(
    "get",
    baseUrlApi(`${prefix}/${id}`)
  );
};
