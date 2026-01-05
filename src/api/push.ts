import { http } from "../utils/http";
import { baseUrlApi } from "./utils";
import type { CommonResult } from "./type";

const prefix = "/push/";

// 推送配置相关
export async function getPushConfigApi() {
  return await http.request<CommonResult>("get", baseUrlApi(prefix + "config"));
}

export async function updatePushConfigApi(data: {
  pushDeerEnabled?: boolean;
  pushDeerKey?: string;
  emailEnabled?: boolean;
  emailHost?: string;
  emailPort?: number;
  emailAuthUser?: string;
  emailAuthPass?: string;
  smsEnabled?: boolean;
  smsAppId?: string;
  smsSignName?: string;
  smsTemplateId?: string;
}) {
  return await http.request<CommonResult>(
    "patch",
    baseUrlApi(prefix + "config"),
    {
      data
    }
  );
}

// 测试推送
export async function testPushDeerApi(
  text: string,
  desp: string,
  type?: "text" | "markdown" | "image"
) {
  return await http.request<CommonResult>(
    "post",
    baseUrlApi(prefix + "test/pushdeer"),
    {
      data: { text, desp, type }
    }
  );
}

export async function testEmailApi(
  email: string,
  title: string,
  text: string,
  type?: "text" | "html"
) {
  return await http.request<CommonResult>(
    "post",
    baseUrlApi(prefix + "test/email"),
    {
      data: { email, title, text, type }
    }
  );
}

export async function testSmsApi(phone: string, code: string) {
  return await http.request<CommonResult>(
    "post",
    baseUrlApi(prefix + "test/sms"),
    {
      data: { phone, code }
    }
  );
}

// 推送历史
export async function getPushHistoryApi(params?: {
  page?: number;
  size?: number;
  type?: string;
  status?: string;
  startTime?: string;
  endTime?: string;
}) {
  return await http.request<CommonResult>(
    "get",
    baseUrlApi(prefix + "history"),
    {
      params
    }
  );
}

export async function getPushHistoryDetailApi(id: string) {
  return await http.request<CommonResult>(
    "get",
    baseUrlApi(prefix + "history/" + id)
  );
}
