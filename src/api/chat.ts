import { http } from "../utils/http";
import { baseUrlApi } from "./utils";
import type { CommonResult } from "./type";

const prefix = "/chat/";

export async function createChatApi() {
  return await http.request<CommonResult>("post", baseUrlApi(prefix));
}

export async function chatApi(data: {
  uid: string;
  batchId: string;
  messages: Array<{ role: string; content: string }>;
  url?: string;
  model?: string;
}) {
  return await http.request<CommonResult>("patch", baseUrlApi(prefix), {
    data
  });
}

export async function getChatApi(uid: string) {
  return await http.request<CommonResult>("get", baseUrlApi(prefix + uid));
}

export async function migrateChatApi(uid: string) {
  return await http.request<CommonResult>("patch", baseUrlApi(prefix + uid));
}

export async function deleteChatApi(uid: string) {
  return await http.request<CommonResult>("delete", baseUrlApi(prefix + uid));
}

export async function getChatCountApi() {
  return await http.request<CommonResult>("get", baseUrlApi(prefix + "count"));
}
