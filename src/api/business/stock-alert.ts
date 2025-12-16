import { http } from "../../utils/http";
import { baseUrlApi } from "../utils";
import type { CommonResult } from "../type";

const alertPrefix = "/stock-alert/";
const expiryPrefix = "/expiry-alert/";

// 库存预警
export async function createStockAlertApi(data: object) {
  return await http.request<CommonResult>("post", baseUrlApi(alertPrefix), {
    data
  });
}

export async function getStockAlertListApi(params?: object) {
  return await http.request<CommonResult>("get", baseUrlApi(alertPrefix), {
    params
  });
}

export async function scanStockAlertApi() {
  return await http.request<CommonResult>(
    "post",
    baseUrlApi(alertPrefix + "scan")
  );
}

// 效期预警
export async function createExpiryAlertApi(data: object) {
  return await http.request<CommonResult>("post", baseUrlApi(expiryPrefix), {
    data
  });
}

export async function getExpiryAlertListApi(params?: object) {
  return await http.request<CommonResult>("get", baseUrlApi(expiryPrefix), {
    params
  });
}
