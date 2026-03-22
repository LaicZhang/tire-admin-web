import { http } from "@/utils/http";
import { baseUrlApi } from "../utils";
import type { CommonResult } from "../type";

export async function getClosingRecordsApi(params?: Record<string, unknown>) {
  return await http.request<CommonResult>(
    "get",
    baseUrlApi("/setting/closing/records"),
    { params }
  );
}

export async function runClosingChecksApi(
  closingDate: string,
  action: "close" | "unclose"
) {
  return await http.request<CommonResult>(
    "post",
    baseUrlApi("/setting/closing/check"),
    {
      data: { closingDate, action }
    }
  );
}

export async function executeClosingApi(
  closingDate: string,
  action: "close" | "unclose",
  reason: string
) {
  return await http.request<CommonResult>(
    "post",
    baseUrlApi("/setting/closing/execute"),
    {
      data: { closingDate, action, confirm: true, reason }
    }
  );
}
