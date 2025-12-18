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

export interface PermissionResult extends CommonResult {
  data: {
    list: PermissionItem[];
    total: number;
    count?: number; // Some APIs use count
  };
}

export const getPermissionListApi = (params?: object) => {
  return http.request<PermissionResult>("get", baseUrlApi(`${prefix}/list`), {
    params
  });
};

export const createPermissionApi = (data: object) => {
  return http.request<CommonResult>("post", baseUrlApi(prefix), {
    data
  });
};

export const updatePermissionApi = (id: string, data: object) => {
  return http.request<CommonResult>("patch", baseUrlApi(`${prefix}/${id}`), {
    data
  });
};

export const deletePermissionApi = (id: string) => {
  return http.request<CommonResult>("delete", baseUrlApi(`${prefix}/${id}`));
};
