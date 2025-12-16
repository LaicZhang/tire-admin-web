import { http } from "../../utils/http";
import { baseUrlApi } from "../utils";
import type { CommonResult } from "../type";

const prefix = "/purchase-plan/";

export async function createPurchasePlanApi(data: object) {
  return await http.request<CommonResult>("post", baseUrlApi(prefix), {
    data
  });
}

export async function getPurchasePlanListApi(params?: object) {
  return await http.request<CommonResult>("get", baseUrlApi(prefix), {
    params
  });
}

export async function deletePurchasePlanApi(id: number) {
  return await http.request<CommonResult>("delete", baseUrlApi(prefix + id));
}

export async function predictPurchasePlanApi(params: {
  tireId: string;
  period: number;
}) {
  return await http.request<CommonResult>(
    "get",
    baseUrlApi(prefix + "predict"),
    {
      params
    }
  );
}
