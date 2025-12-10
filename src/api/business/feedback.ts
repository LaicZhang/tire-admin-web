import { http } from "../../utils/http";
import { baseUrlApi } from "../utils";
import type { CommonResult } from "../type";

const prefix = "/feedback/";

export async function getFeedbackListApi(
  index: number,
  params?: {
    content?: string;
    rating?: number;
    status?: number;
    type?: number;
  }
) {
  return await http.request<CommonResult>(
    "get",
    baseUrlApi(prefix + "page/" + index),
    { params }
  );
}

export async function addFeedbackApi(data: {
  content: string;
  rating?: number;
  status?: number;
  type?: number;
}) {
  return await http.request<CommonResult>("post", baseUrlApi(prefix), {
    data
  });
}

export async function getFeedbackApi(uid: string) {
  return await http.request<CommonResult>("get", baseUrlApi(prefix + uid));
}

export async function updateFeedbackApi(
  uid: string,
  data: {
    content?: string;
    rating?: number;
    status?: number;
    type?: number;
  }
) {
  return await http.request<CommonResult>("patch", baseUrlApi(prefix + uid), {
    data
  });
}

export async function deleteFeedbackApi(uid: string) {
  return await http.request<CommonResult>("delete", baseUrlApi(prefix + uid));
}
