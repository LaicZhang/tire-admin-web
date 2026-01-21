import { http } from "@/utils/http";
import { baseUrlApi } from "../utils";
import type { CommonResult } from "../type";

export async function getOperationLogsApi(params?: Record<string, unknown>) {
  return await http.request<CommonResult>(
    "get",
    baseUrlApi("/operation-log/"),
    {
      params
    }
  );
}
