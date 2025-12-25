import { http } from "../utils/http";
import { baseUrlApi } from "./utils";
import type { CommonResult, CreatePaymentDto, UpdatePaymentDto } from "./type";

const prefix = "/payment/";

export async function getPaymentListApi(companyUid?: string) {
  const url = companyUid
    ? baseUrlApi(prefix + `list/${companyUid}`)
    : baseUrlApi(prefix + "list");
  return await http.request<CommonResult>("get", url);
}

export async function getPaymentApi(uid: string) {
  return await http.request<CommonResult>("get", baseUrlApi(prefix + uid));
}

export async function createPaymentApi(data: CreatePaymentDto) {
  return await http.request<CommonResult>("post", baseUrlApi(prefix), {
    data
  });
}

export async function updatePaymentApi(uid: string, data: UpdatePaymentDto) {
  return await http.request<CommonResult>("patch", baseUrlApi(prefix + uid), {
    data
  });
}

export async function checkPaymentBalanceApi(uid: string, amount: number) {
  return await http.request<CommonResult>(
    "get",
    baseUrlApi(prefix + `${uid}/${amount}`)
  );
}

export async function deletePaymentApi(uid: string) {
  return await http.request<CommonResult>("delete", baseUrlApi(prefix + uid));
}
