import { http } from "@/utils/http";
import { baseUrlApi } from "./utils";
import type { CommonResult, RefreshTokenResult, UserResult } from "./type";

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

export const getCurrentCompanyAPi = async () => {
  return await http.request<CommonResult>(
    "get",
    baseUrlApi("/auth/current-company")
  );
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

export const getNoticeApi = () => {
  return http.request<CommonResult>("get", baseUrlApi("/auth/notice"));
};

export const getCompanyInfoApi = (type: string) => {
  return http.request<CommonResult>(
    "get",
    baseUrlApi("/auth/company-info" + "/" + type)
  );
};

export const updateCompanyInfoApi = (data?: object) => {
  return http.request<CommonResult>(
    "patch",
    baseUrlApi("/auth/company-info", { data })
  );
};

export const getUserInfoApi = () => {
  return http.request<CommonResult>("get", baseUrlApi("/auth/info"));
};

export const updateUserInfoApi = (data?: object) => {
  return http.request<CommonResult>("patch", baseUrlApi("/auth/info"), {
    data
  });
};

export const getLogApi = (index: number, params?: object) => {
  return http.request<CommonResult>(
    "get",
    baseUrlApi("/auth/login-history/page") + `/${index}`,
    { params }
  );
};
