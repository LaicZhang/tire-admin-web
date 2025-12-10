import { http } from "../utils/http";
import { baseUrlApi } from "./utils";
import type { CommonResult } from "./type";

const prefix = "/logistic/";

export async function getLogisticListApi(
  index: number,
  params?: {
    type?: string;
    isArrival?: boolean;
    query?: string;
  }
) {
  return await http.request<CommonResult>(
    "get",
    baseUrlApi(prefix + `page/${index}`),
    { params }
  );
}

export async function getLogisticApi(uid: string, type: string) {
  return await http.request<CommonResult>("get", baseUrlApi(prefix + uid), {
    params: { type }
  });
}

export async function updateLogisticApi(
  uid: string,
  data: {
    type: string;
    isArrival: boolean;
    [key: string]: any;
  }
) {
  return await http.request<CommonResult>("patch", baseUrlApi(prefix + uid), {
    data
  });
}

export async function cancelLogisticApi(uid: string, type: string) {
  return await http.request<CommonResult>("delete", baseUrlApi(prefix + uid), {
    params: { type }
  });
}
