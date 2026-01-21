import { http } from "../../utils/http";
import { baseUrlApi } from "../utils";
import type { CommonResult } from "../type";

const prefix = "/sale-quotation/";

export async function createSaleQuotationApi(data: object) {
  return await http.request<CommonResult>("post", baseUrlApi(prefix), {
    data
  });
}

export async function getSaleQuotationListApi(
  params?: Record<string, unknown>
) {
  return await http.request<CommonResult>("get", baseUrlApi(prefix), {
    params
  });
}

export async function updateSaleQuotationStatusApi(id: number, status: string) {
  return await http.request<CommonResult>(
    "post",
    baseUrlApi(prefix + id + "/status"),
    {
      data: { status }
    }
  );
}

export async function convertSaleQuotationApi(id: number) {
  return await http.request<CommonResult>(
    "post",
    baseUrlApi(prefix + id + "/convert"),
    { data: {} }
  );
}
