import { http } from "../../utils/http";
import { baseUrlApi } from "../utils";
import type { CommonResult } from "../type";

const prefix = "/purchase/";

/** 采购计划 API */
export async function getPurchasePlanListApi(index: number, params?: object) {
  return await http.request<CommonResult>(
    "get",
    baseUrlApi(prefix + "plan/" + index),
    { params }
  );
}

export async function createPurchasePlanApi(data: object) {
  return await http.request<CommonResult>("post", baseUrlApi(prefix + "plan"), {
    data
  });
}

export async function updatePurchasePlanApi(id: string, data: object) {
  return await http.request<CommonResult>(
    "patch",
    baseUrlApi(prefix + "plan/" + id),
    {
      data
    }
  );
}

export async function deletePurchasePlanApi(id: string) {
  return await http.request<CommonResult>(
    "delete",
    baseUrlApi(prefix + "plan/" + id)
  );
}

/** 采购询价 API */
export async function getPurchaseInquiryListApi(
  index: number,
  params?: object
) {
  return await http.request<CommonResult>(
    "get",
    baseUrlApi(prefix + "inquiry/" + index),
    { params }
  );
}

export async function createPurchaseInquiryApi(data: object) {
  return await http.request<CommonResult>(
    "post",
    baseUrlApi(prefix + "inquiry"),
    {
      data
    }
  );
}

export async function updatePurchaseInquiryApi(id: string, data: object) {
  return await http.request<CommonResult>(
    "patch",
    baseUrlApi(prefix + "inquiry/" + id),
    {
      data
    }
  );
}

export async function deletePurchaseInquiryApi(id: string) {
  return await http.request<CommonResult>(
    "delete",
    baseUrlApi(prefix + "inquiry/" + id)
  );
}
