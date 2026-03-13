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
  id?: number;
  uid: string;
  batchId?: string | null;
  userId?: string;
  version?: number | null;
  question?: string | null;
  answer?: string | null;
  index?: number | null;
  createAt?: string | null;
  deleteAt?: string | null;
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
  return await http.request<string>("patch", baseUrlApi(prefix), {
    data,
    responseType: "text"
  });
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
