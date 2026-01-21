import { http } from "@/utils/http";
import { baseUrlApi } from "../utils";
import type { CommonResult } from "../type";

export async function getClosingRecordsApi(params?: Record<string, unknown>) {
  return await http.request<CommonResult>("get", baseUrlApi("/closing/"), {
    params
  });
}

export async function runClosingChecksApi(period: string) {
  return await http.request<CommonResult>(
    "post",
    baseUrlApi("/closing/check"),
    {
      data: { period }
    }
  );
}

export async function executeClosingApi(
  period: string,
  action: "close" | "unclose"
) {
  return await http.request<CommonResult>(
    "post",
    baseUrlApi("/closing/execute"),
    {
      data: { period, action }
    }
  );
}
