import { http } from "../utils/http";
import { baseUrlApi } from "./utils";
import type { CommonResult } from "./type";

const prefix = "/verify/";

export async function getVerifyCodeApi(data: {
  code: string;
  phone?: string;
  email?: string;
  type?: number;
}) {
  return await http.request<CommonResult>("post", baseUrlApi(prefix + "code"), {
    data
  });
}

export async function getCaptchaApi() {
  return await http.request<CommonResult>(
    "get",
    baseUrlApi(prefix + "captcha")
  );
}
