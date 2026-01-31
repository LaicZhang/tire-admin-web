import { http } from "../utils/http";
import { baseUrlApi } from "./utils";
import type { CommonResult } from "./type";

const prefix = "/chat/";

export interface ChatMessage {
  role: string;
  content: string;
  _uid?: string;
}

export interface ChatSession {
  uid: string;
  batchId: string;
  messages: ChatMessage[];
}

export async function createChatApi() {
  return await http.request<CommonResult<ChatSession>>(
    "post",
    baseUrlApi(prefix)
  );
}

export async function chatApi(data: {
  uid: string;
  batchId: string;
  messages: ChatMessage[];
  url?: string;
  model?: string;
}) {
  return await http.request<CommonResult<ChatSession>>(
    "patch",
    baseUrlApi(prefix),
    {
      data
    }
  );
}

export async function getChatApi(uid: string) {
  return await http.request<CommonResult<ChatSession>>(
    "get",
    baseUrlApi(prefix + uid)
  );
}

export async function migrateChatApi(uid: string) {
  return await http.request<CommonResult>("patch", baseUrlApi(prefix + uid));
}

export async function deleteChatApi(uid: string) {
  return await http.request<CommonResult>("delete", baseUrlApi(prefix + uid));
}

export async function getChatCountApi() {
  return await http.request<CommonResult<{ count: number }>>(
    "get",
    baseUrlApi(prefix + "count")
  );
}
