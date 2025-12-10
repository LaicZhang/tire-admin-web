import { http } from "../utils/http";
import { baseUrlApi } from "./utils";
import type { CommonResult } from "./type";

const prefix = "/payment/";

export async function getPaymentListApi() {
  return await http.request<CommonResult>("get", baseUrlApi(prefix + "list"));
}

export async function getPaymentApi(uid: string) {
  return await http.request<CommonResult>("get", baseUrlApi(prefix + uid));
}
