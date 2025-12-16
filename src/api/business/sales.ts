import { http } from "../../utils/http";
import { baseUrlApi } from "../utils";
import type { CommonResult } from "../type";

const prefix = "/sales/";

/** 销售报价单 API */
export async function getSalesQuotationListApi(index: number, params?: object) {
  return await http.request<CommonResult>(
    "get",
    baseUrlApi(prefix + "quotation/" + index),
    { params }
  );
}

export async function createSalesQuotationApi(data: object) {
  return await http.request<CommonResult>(
    "post",
    baseUrlApi(prefix + "quotation"),
    {
      data
    }
  );
}

export async function updateSalesQuotationApi(id: string, data: object) {
  return await http.request<CommonResult>(
    "patch",
    baseUrlApi(prefix + "quotation/" + id),
    {
      data
    }
  );
}

export async function deleteSalesQuotationApi(id: string) {
  return await http.request<CommonResult>(
    "delete",
    baseUrlApi(prefix + "quotation/" + id)
  );
}
