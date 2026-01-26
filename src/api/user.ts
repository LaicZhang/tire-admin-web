import { http } from "@/utils/http";
import { baseUrlApi } from "./utils";
import type { CommonResult } from "./type";

const prefix = "/user/";

/** 用户查询参数 */
export interface UserQueryDto {
  keyword?: string;
  username?: string;
  phone?: string;
  email?: string;
  status?: number;
}

/** 用户创建 DTO */
export interface CreateUserDto {
  username: string;
  password: string;
  phone?: string;
  email?: string;
  nickname?: string;
  roleIds?: number[];
}

/** 用户更新 DTO */
export interface UpdateUserDto {
  username?: string;
  password?: string;
  phone?: string;
  email?: string;
  nickname?: string;
  status?: number;
  roleIds?: number[];
}

export const getUsersApi = (index = 1, params?: UserQueryDto) => {
  return http.request<CommonResult<{ list: UserDto[]; count: number }>>(
    "get",
    baseUrlApi(prefix + "page/" + index),
    { params }
  );
};

/** 用户 DTO - 用于列表返回 */
export interface UserDto {
  uid: string;
  username: string;
  phone: string;
  email?: string;
  status: string;
}

export const getOneUserApi = (uid: string) => {
  return http.request<CommonResult>("get", baseUrlApi(prefix) + `/${uid}`);
};

export const addUserApi = (data: CreateUserDto) => {
  return http.request<CommonResult>("post", baseUrlApi(prefix), { data });
};

export const updateUserApi = (uid: string, data: UpdateUserDto) => {
  return http.request<CommonResult>("patch", baseUrlApi(prefix) + `/${uid}`, {
    data
  });
};

export const deleteUserApi = (uid: string) => {
  return http.request<CommonResult>("delete", baseUrlApi(prefix) + `/${uid}`);
};
