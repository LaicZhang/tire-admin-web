import { http } from "../utils/http";
import { baseUrlApi } from "./utils";
import type { CommonResult } from "./type";

const prefix = "/logistic/";

export async function getLogisticListApi(params?: {
  type?: string;
  isArrival?: boolean;
}) {
  return await http.request<CommonResult>("get", baseUrlApi(prefix + "list"), {
    params
  });
}

export async function updateLogisticApi(data: {
  type: string;
  isArrival: boolean;
}) {
  return await http.request<CommonResult>("patch", baseUrlApi(prefix), {
    data
  });
}
