import { http } from "../../utils/http";
import { baseUrlApi } from "../utils";
import type { CommonResult } from "../type";

const prefix = "/price-list/";

export async function createPriceListApi(data: object) {
  return await http.request<CommonResult>("post", baseUrlApi(prefix), {
    data
  });
}

export async function getPriceListApi(params?: object) {
  return await http.request<CommonResult>("get", baseUrlApi(prefix), {
    params
  });
}

export async function addPriceListDetailApi(id: number, data: object) {
  return await http.request<CommonResult>(
    "post",
    baseUrlApi(prefix + id + "/detail"),
    {
      data
    }
  );
}

export async function deletePriceListDetailApi(detailId: number) {
  return await http.request<CommonResult>(
    "delete",
    baseUrlApi(prefix + "detail/" + detailId)
  );
}

export async function assignPriceListToCustomerApi(id: number, data: object) {
  return await http.request<CommonResult>(
    "post",
    baseUrlApi(prefix + id + "/assign-customer"),
    {
      data
    }
  );
}

export async function queryPriceApi(params: {
  customerId: string;
  tireId: string;
  quantity?: number;
}) {
  return await http.request<CommonResult>("get", baseUrlApi("/price/query"), {
    params
  });
}
