import { http } from "@/utils/http";
import { baseUrlApi } from "./utils";
import type { CommonResult, RefreshTokenResult, UserResult } from "./type";

/** 登录请求参数 */
export interface LoginDto {
  username: string;
  password: string;
  code?: string;
  /** 图形验证码（密码登录时必填） */
  captchaCode?: string;
  isRemember?: boolean;
}

/** 刷新 Token 请求参数 */
export interface RefreshTokenDto {
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
export interface UpdateCompanyInfoDto {
  name?: string;
  desc?: string;
  principalName?: string;
  principalPhone?: string;
  province?: string;
  city?: string;
}

/** 更新用户信息参数 */
interface UpdateUserInfoDto {
  nickname?: string;
  phone?: string;
  email?: string;
  gender?: number;
  birthday?: string;
}

/** 登录历史查询参数 */
interface LoginHistoryQueryDto {
  startDate?: string;
  endDate?: string;
  ip?: string;
}

/**
 * 用户登录
 * @param data - 登录参数（用户名、密码、验证码等）
 * @returns 用户信息和 token
 */
export const getLogin = (data: LoginDto) => {
  return http.request<UserResult>("post", baseUrlApi("/auth/login"), { data });
};

/**
 * 刷新访问令牌
 * @param data - 包含 refreshToken 的对象
 * @returns 新的 accessToken 和 refreshToken
 */
export const refreshTokenApi = (data: RefreshTokenDto) => {
  return http.request<RefreshTokenResult>(
    "post",
    baseUrlApi("/auth/refresh-token"),
    { data }
  );
};

/**
 * 获取当前公司信息
 * @returns 当前公司 ID 和名称
 */
export const getCurrentCompanyApi = async () => {
  return await http.request<CommonResult>(
    "get",
    baseUrlApi("/auth/current-company")
  );
};

/**
 * 设置/切换当前公司
 * @param data - 包含目标公司 ID 的对象
 * @returns 操作结果
 */
export const determineCurrentCompanyApi = (
  data?: DetermineCurrentCompanyDto
) => {
  return http.request<CommonResult>(
    "post",
    baseUrlApi("/auth/current-company"),
    { data }
  );
};

/**
 * 发送验证码
 * @param data - 发送验证码参数（邮箱/手机、验证类型）
 * @returns 操作结果
 */
export const getVerifyCodeApi = (data?: SendVerifyCodeDto) => {
  return http.request<CommonResult>("post", baseUrlApi("/verify/code"), {
    data
  });
};

/**
 * 获取系统通知
 * @returns 通知列表
 */
export const getNoticeApi = () => {
  return http.request<CommonResult>("get", baseUrlApi("/auth/notice"));
};

/**
 * 获取公司信息
 * @param type - 公司类型（如 'own' 获取本公司信息）
 * @returns 公司详细信息
 */
export const getCompanyInfoApi = (type: string) => {
  return http.request<CommonResult>(
    "get",
    baseUrlApi(`/auth/company-info/${type}`)
  );
};

/**
 * 更新公司信息
 * @param data - 更新的公司信息字段
 * @returns 操作结果
 */
export const updateCompanyInfoApi = (data?: UpdateCompanyInfoDto) => {
  return http.request<CommonResult>("patch", baseUrlApi("/auth/company-info"), {
    data
  });
};

/**
 * 获取当前用户信息
 * @returns 用户详细信息
 */
export const getUserInfoApi = () => {
  return http.request<CommonResult>("get", baseUrlApi("/auth/info"));
};

/**
 * 更新用户信息
 * @param data - 更新的用户信息字段
 * @returns 操作结果
 */
export const updateUserInfoApi = (data?: UpdateUserInfoDto) => {
  return http.request<CommonResult>("patch", baseUrlApi("/auth/info"), {
    data
  });
};

/**
 * 获取登录历史记录
 * @param index - 页码
 * @param params - 查询参数（时间范围、IP 等）
 * @returns 分页的登录历史列表
 */
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
