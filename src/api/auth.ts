import { http } from "@/utils/http";
import { baseUrlApi } from "./utils";

export type CommonResult = {
  code: number;
  message: string;
  data: any;
};

export type UserResult = {
  code: number;
  message: string;
  data: {
    /** 用户名 */
    username: string;
    /** 当前登陆用户的角色 */
    roles: Array<string>;
    /** `token` */
    accessToken: string;
    /** 用于调用刷新`accessToken`的接口时所需的`token` */
    refreshToken: string;
    /** `accessToken`的过期时间（格式'xxxx/xx/xx xx:xx:xx'） */
    expires: Date;
  };
};

export type RefreshTokenResult = {
  code: number;
  message: string;
  data: {
    /** `token` */
    accessToken: string;
    /** 用于调用刷新`accessToken`的接口时所需的`token` */
    refreshToken: string;
    /** `accessToken`的过期时间（格式'xxxx/xx/xx xx:xx:xx'） */
    expires: Date;
  };
};

/** 登录 */
export const getLogin = (data?: object) => {
  return http.request<UserResult>("post", baseUrlApi("/auth/login"), { data });
};

/** 刷新token */
export const refreshTokenApi = (data?: object) => {
  return http.request<RefreshTokenResult>(
    "post",
    baseUrlApi("/auth/refresh-token"),
    { data }
  );
};

export const getCurrentCompanyAPi = () => {
  return http.request<CommonResult>("get", baseUrlApi("/auth/current-company"));
};

export const determineCurrentCompanyApi = (data?: object) => {
  return http.request<CommonResult>(
    "post",
    baseUrlApi("/auth/current-company"),
    { data }
  );
};

export const getVerifyCodeApi = (data?: object) => {
  return http.request<CommonResult>("post", baseUrlApi("/verify/code"), {
    data
  });
};

export const getUserInfoApi = () => {
  return http.request<CommonResult>("get", baseUrlApi("/auth/info"));
};

export const updateUserInfoApi = (data?: object) => {
  return http.request<CommonResult>("patch", baseUrlApi("/auth/info"), {
    data
  });
};