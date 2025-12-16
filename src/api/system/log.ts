import { http } from "@/utils/http";
import { baseUrlApi } from "../utils";
import type { CommonResult } from "../type";

const prefix = "/system/log/";

/** 获取操作日志列表 */
export async function getOperationLogListApi(
  index: number,
  params?: {
    module?: string;
    method?: string;
    operator?: string;
    startDate?: string;
    endDate?: string;
    success?: boolean;
  }
) {
  return await http.request<CommonResult>(
    "get",
    baseUrlApi(prefix + `list/${index}`),
    { params }
  );
}
