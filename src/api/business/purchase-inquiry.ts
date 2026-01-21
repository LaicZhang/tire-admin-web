import { http } from "../../utils/http";
import { baseUrlApi } from "../utils";
import type { CommonResult } from "../type";

const inquiryPrefix = "/purchase-inquiry/";
const quotationPrefix = "/purchase-quotation/";

// 询价单
export async function createPurchaseInquiryApi(data: object) {
  return await http.request<CommonResult>("post", baseUrlApi(inquiryPrefix), {
    data
  });
}

export async function getPurchaseInquiryListApi(
  params?: Record<string, unknown>
) {
  return await http.request<CommonResult>("get", baseUrlApi(inquiryPrefix), {
    params
  });
}

export async function sendPurchaseInquiryApi(id: number) {
  return await http.request<CommonResult>(
    "post",
    baseUrlApi(inquiryPrefix + id + "/send")
  );
}

// 报价单
export async function createPurchaseQuotationApi(data: object) {
  return await http.request<CommonResult>("post", baseUrlApi(quotationPrefix), {
    data
  });
}

export async function getPurchaseQuotationListApi(
  params?: Record<string, unknown>
) {
  return await http.request<CommonResult>("get", baseUrlApi(quotationPrefix), {
    params
  });
}
