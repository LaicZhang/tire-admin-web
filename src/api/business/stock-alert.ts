import { http } from "../../utils/http";
import { baseUrlApi } from "../utils";
import type { CommonResult } from "../type";

const alertPrefix = "/stock-alert/";
const expiryPrefix = "/expiry-alert/";

export interface StockAlertDto {
  tireId: string;
  minQuantity: number;
}

export interface StockAlert extends StockAlertDto {
  id: number;
  uid: string;
}

export interface ExpiryAlertDto {
  tireId: string;
  daysBefore: number;
}

export interface ExpiryAlert extends ExpiryAlertDto {
  id: number;
  uid: string;
}

// 库存预警
export async function createStockAlertApi(data: StockAlertDto) {
  return await http.request<CommonResult<StockAlert>>(
    "post",
    baseUrlApi(alertPrefix),
    {
      data
    }
  );
}

export async function getStockAlertListApi(params?: object) {
  return await http.request<CommonResult<StockAlert[]>>(
    "get",
    baseUrlApi(alertPrefix),
    {
      params
    }
  );
}

export async function scanStockAlertApi() {
  return await http.request<CommonResult<{ alertCount: number }>>(
    "post",
    baseUrlApi(alertPrefix + "scan")
  );
}

// 效期预警
export async function createExpiryAlertApi(data: ExpiryAlertDto) {
  return await http.request<CommonResult<ExpiryAlert>>(
    "post",
    baseUrlApi(expiryPrefix),
    {
      data
    }
  );
}

export async function getExpiryAlertListApi(params?: object) {
  return await http.request<CommonResult<ExpiryAlert[]>>(
    "get",
    baseUrlApi(expiryPrefix),
    {
      params
    }
  );
}
