import { http } from "@/utils/http";
import { baseUrlApi } from "./utils";
import type { CommonResult } from "./type";

const prefix = "/user/";

export const getUsersApi = (index = 1, params?: object) => {
  return http.request<CommonResult>(
    "get",
    baseUrlApi(prefix + "page/" + index),
    { params }
  );
};

export const getOneUserApi = (uid: string) => {
  return http.request<CommonResult>("get", baseUrlApi(prefix) + `/${uid}`);
};

export const addUserApi = (data: object) => {
  return http.request<CommonResult>("post", baseUrlApi(prefix), data);
};

export const updateUserApi = (uid: string, data: object) => {
  return http.request<CommonResult>(
    "patch",
    baseUrlApi(prefix) + `/${uid}`,
    data
  );
};

export const deleteUserApi = (uid: string) => {
  return http.request<CommonResult>("delete", baseUrlApi(prefix) + `/${uid}`);
};
