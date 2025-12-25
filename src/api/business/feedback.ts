import { http } from "../../utils/http";
import { baseUrlApi } from "../utils";
import type { CommonResult, PaginatedResponseDto } from "../type";

const prefix = "/feedback/";

export interface FeedbackDto {
  content: string;
  rating?: number;
  status?: number;
  type?: number;
}

export interface Feedback extends FeedbackDto {
  id: number;
  uid: string;
}

export async function getFeedbackListApi(
  index: number,
  params?: {
    content?: string;
    rating?: number;
    status?: number;
    type?: number;
  }
) {
  return await http.request<CommonResult<PaginatedResponseDto<Feedback>>>(
    "get",
    baseUrlApi(prefix + "page/" + index),
    { params }
  );
}

export async function addFeedbackApi(data: FeedbackDto) {
  return await http.request<CommonResult<Feedback>>(
    "post",
    baseUrlApi(prefix),
    {
      data
    }
  );
}

export async function getFeedbackApi(uid: string) {
  return await http.request<CommonResult<Feedback>>(
    "get",
    baseUrlApi(prefix + uid)
  );
}

export async function updateFeedbackApi(
  uid: string,
  data: Partial<FeedbackDto>
) {
  return await http.request<CommonResult<Feedback>>(
    "patch",
    baseUrlApi(prefix + uid),
    {
      data
    }
  );
}

export async function deleteFeedbackApi(uid: string) {
  return await http.request<CommonResult<void>>(
    "delete",
    baseUrlApi(prefix + uid)
  );
}
