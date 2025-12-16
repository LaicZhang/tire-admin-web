import { http } from "../../utils/http";
import { baseUrlApi } from "../utils";
import type { CommonResult } from "../type";

const prefix = "/price/";

export async function getPriceListListApi(index: number, params?: object) {
  return await http.request<CommonResult>(
    "get",
    baseUrlApi(prefix + "list/page/" + index),
    { params }
  );
}

export async function createPriceListApi(data: object) {
  return await http.request<CommonResult>("post", baseUrlApi(prefix + "list"), {
    data
  });
}

export async function updatePriceListApi(id: string, data: object) {
  return await http.request<CommonResult>(
    "patch",
    baseUrlApi(prefix + "list/" + id),
    {
      data
    }
  );
}

export async function deletePriceListApi(id: string) {
  return await http.request<CommonResult>(
    "delete",
    baseUrlApi(prefix + "list/" + id)
  );
}

export async function getProductPriceApi(params: object) {
  return await http.request<CommonResult>("get", baseUrlApi(prefix + "query"), {
    params
  });
}

export async function assignPriceListApi(data: object) {
  return await http.request<CommonResult>(
    "post",
    baseUrlApi(prefix + "assign"),
    { data }
  );
}
