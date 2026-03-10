import { http } from "../utils/http";
import { baseUrlApi } from "./utils";
import type {
  CommonResult,
  CreatePaymentDto,
  PaginatedResponseDto,
  PaymentAccount,
  UpdatePaymentDto
} from "./type";

const prefix = "/payment/";

export type PaymentListData =
  | PaymentAccount[]
  | { list?: PaymentAccount[]; count?: number };

export interface PaymentPageQuery {
  pageSize?: number;
  keyword?: string;
  status?: boolean;
}

export async function getPaymentListApi(companyUid?: string) {
  const url = companyUid
    ? baseUrlApi(prefix + `list/${companyUid}`)
    : baseUrlApi(prefix + "list");
  return await http.request<CommonResult<PaymentListData>>("get", url);
}

export async function getPaymentPageApi(
  index: number,
  params?: PaymentPageQuery
) {
  return await http.request<CommonResult<PaginatedResponseDto<PaymentAccount>>>(
    "get",
    baseUrlApi(prefix + `page/${index}`),
    {
      params
    }
  );
}

export async function getPaymentApi(uid: string) {
  return await http.request<CommonResult<PaymentAccount>>(
    "get",
    baseUrlApi(prefix + uid)
  );
}

export async function createPaymentApi(data: CreatePaymentDto) {
  return await http.request<CommonResult<PaymentAccount>>(
    "post",
    baseUrlApi(prefix),
    {
      data
    }
  );
}

export async function updatePaymentApi(uid: string, data: UpdatePaymentDto) {
  return await http.request<CommonResult<PaymentAccount>>(
    "patch",
    baseUrlApi(prefix + uid),
    {
      data
    }
  );
}

export async function checkPaymentBalanceApi(uid: string, amount: number) {
  return await http.request<CommonResult<unknown>>(
    "get",
    baseUrlApi(prefix + `${uid}/${amount}`)
  );
}

export async function deletePaymentApi(uid: string) {
  return await http.request<CommonResult<void>>(
    "delete",
    baseUrlApi(prefix + uid)
  );
}
