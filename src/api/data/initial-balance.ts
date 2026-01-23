import { http } from "../../utils/http";
import { baseUrlApi } from "../utils";
import type { CommonResult, PaginatedResponseDto } from "../type";

const prefix = "/finance-extension/";

export interface InitialBalanceRecord {
  id: number;
  uid?: string;
  customerId?: string | null;
  providerId?: string | null;
  type: string;
  amount: string | number;
  date: string;
  remark?: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
}

export async function createInitialBalanceApi(data: {
  type: string;
  amount: number;
  date: string;
  remark?: string;
  uid?: string;
  customerId?: string;
  providerId?: string;
}) {
  return await http.request<CommonResult<InitialBalanceRecord>>(
    "post",
    baseUrlApi(prefix + "initial-balance"),
    {
      data: {
        type: data.type,
        amount: data.amount,
        date: data.date,
        ...(data.uid !== undefined ? { uid: data.uid } : {}),
        ...(data.remark !== undefined ? { remark: data.remark } : {}),
        ...(data.customerId
          ? { customer: { connect: { uid: data.customerId } } }
          : {}),
        ...(data.providerId
          ? { provider: { connect: { uid: data.providerId } } }
          : {})
      }
    }
  );
}

export async function getInitialBalanceListApi(
  index: number,
  params?: {
    uid?: string;
    customerId?: string;
    providerId?: string;
    type?: string;
  }
) {
  return await http.request<
    CommonResult<PaginatedResponseDto<InitialBalanceRecord>>
  >("get", baseUrlApi(prefix + `initial-balance/${index}`), { params });
}

/** 批量获取期初余额 */
export async function getInitialBalanceBatchApi(params: {
  providerIds?: string[];
  customerIds?: string[];
  types?: string[];
}) {
  return await http.request<CommonResult<InitialBalanceRecord[]>>(
    "post",
    baseUrlApi(prefix + "initial-balance/batch"),
    { data: params }
  );
}
