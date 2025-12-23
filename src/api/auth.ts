import { http } from "@/utils/http";
import { baseUrlApi } from "./utils";
import type { CommonResult, RefreshTokenResult, UserResult } from "./type";

/** 登录请求参数 */
interface LoginDto {
  username: string;
  password: string;
  code?: string;
  isRemember?: boolean;
}

/** 刷新 Token 请求参数 */
interface RefreshTokenDto {
  refreshToken: string;
}

/** 设置当前公司参数 */
interface DetermineCurrentCompanyDto {
  companyId: string;
}

/** 发送验证码参数 */
interface SendVerifyCodeDto {
  email?: string;
  phone?: string;
  type: "register" | "reset-password" | "bind";
}

/** 更新公司信息参数 */
interface UpdateCompanyInfoDto {
  name?: string;
  address?: string;
  phone?: string;
  bankInfo?: string;
  taxNumber?: string;
  [key: string]: string | undefined;
}

/** 更新用户信息参数 */
interface UpdateUserInfoDto {
  nickname?: string;
  email?: string;
  phone?: string;
  avatar?: string;
}

/** 登录历史查询参数 */
interface LoginHistoryQueryDto {
  startDate?: string;
  endDate?: string;
  ip?: string;
}

/** 登录 */
export const getLogin = (data: LoginDto) => {
  return http.request<UserResult>("post", baseUrlApi("/auth/login"), { data });
};

/** 刷新token */
export const refreshTokenApi = (data: RefreshTokenDto) => {
  return http.request<RefreshTokenResult>(
    "post",
    baseUrlApi("/auth/refresh-token"),
    { data }
  );
};

export const getCurrentCompanyApi = async () => {
  return await http.request<CommonResult>(
    "get",
    baseUrlApi("/auth/current-company")
  );
};

export const determineCurrentCompanyApi = (
  data?: DetermineCurrentCompanyDto
) => {
  return http.request<CommonResult>(
    "post",
    baseUrlApi("/auth/current-company"),
    { data }
  );
};

export const getVerifyCodeApi = (data?: SendVerifyCodeDto) => {
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
    baseUrlApi(`/auth/company-info/${type}`)
  );
};

export const updateCompanyInfoApi = (data?: UpdateCompanyInfoDto) => {
  return http.request<CommonResult>("patch", baseUrlApi("/auth/company-info"), {
    data
  });
};

export const getUserInfoApi = () => {
  return http.request<CommonResult>("get", baseUrlApi("/auth/info"));
};

export const updateUserInfoApi = (data?: UpdateUserInfoDto) => {
  return http.request<CommonResult>("patch", baseUrlApi("/auth/info"), {
    data
  });
};

export const getLogApi = (index: number, params?: LoginHistoryQueryDto) => {
  return http.request<CommonResult>(
    "get",
    baseUrlApi(`/auth/login-history/page/${index}`),
    { params }
  );
};

// ============ 注册相关 ============

/** 检查用户名/邮箱是否存在 */
export const checkExistApi = (param: string) => {
  return http.request<CommonResult>("get", baseUrlApi(`/auth/have/${param}`));
};

/** 用户注册 */
export const registerApi = (data: {
  username: string;
  password: string;
  email: string;
}) => {
  return http.request<CommonResult>("post", baseUrlApi("/auth/register"), {
    data
  });
};

// ============ 密码管理 ============

/** 重置密码 (登录用户) */
export const resetPasswordApi = (data: {
  password?: string;
  newPassword: string;
  code?: string;
}) => {
  return http.request<CommonResult>(
    "patch",
    baseUrlApi("/auth/reset-password"),
    { data }
  );
};

/** 忘记密码 (未登录) */
export const forgetPasswordApi = (
  param: string,
  data: { newPassword: string; code?: string }
) => {
  return http.request<CommonResult>(
    "patch",
    baseUrlApi(`/auth/forget-password/${param}`),
    { data }
  );
};

// ============ 更新历史 ============

/** 获取系统更新历史 */
export const getUpdateHistoryApi = (index: number) => {
  return http.request<CommonResult>(
    "get",
    baseUrlApi(`/auth/update-history/page/${index}`)
  );
};

// ============ 微信登录相关 ============

/** 微信小程序登录 */
export const wxLoginApi = (data: { jsCode: string; isRemember: boolean }) => {
  return http.request<CommonResult>("post", baseUrlApi("/auth/wx-login"), {
    data
  });
};

/** 绑定微信账号 */
export const wxBindApi = (data: { jsCode: string; state?: string }) => {
  return http.request<CommonResult>("post", baseUrlApi("/auth/wx-bind"), {
    data
  });
};

/** 解绑微信账号 */
export const wxUnbindApi = () => {
  return http.request<CommonResult>("delete", baseUrlApi("/auth/wx-bind"));
};

/** 获取微信绑定状态 */
export const getWxBindStatusApi = () => {
  return http.request<CommonResult>("get", baseUrlApi("/auth/wx-bind/status"));
};

/** 获取微信扫码登录URL (PC/Web) */
export const getWxQrLoginUrlApi = () => {
  return http.request<CommonResult>("get", baseUrlApi("/auth/wx-qr/login-url"));
};

/** 微信扫码登录回调 (PC/Web) */
export const wxQrCallbackApi = (params: {
  code: string;
  state: string;
  isRemember?: boolean;
}) => {
  return http.request<CommonResult>("get", baseUrlApi("/auth/wx-qr/callback"), {
    params
  });
};

/** 微信扫码绑定账号 (PC/Web) */
export const wxQrBindApi = (params: { code: string; state: string }) => {
  return http.request<CommonResult>("post", baseUrlApi("/auth/wx-qr/bind"), {
    params
  });
};
