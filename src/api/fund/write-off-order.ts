import { http } from "@/utils/http";
import { baseUrlApi } from "../utils";
import type { CommonResult, PaginatedResponseDto } from "../type";

// ================== 核销单 API ==================
export interface WriteOffOrder {
  id: number;
  uid: string;
  billNo: string;
  businessType: string;
  fromCustomerId?: string;
  toCustomerId?: string;
  fromProviderId?: string;
  toProviderId?: string;
  receivableAmount?: number;
  payableAmount?: number;
  writeOffAmount: number;
  status: string;
  isApproved?: boolean;
  writeOffDate?: string;
  reason?: string;
  remark?: string;
  createdAt?: string;
}

export interface CreateWriteOffDto {
  businessType: string;
  fromCustomerId?: string;
  toCustomerId?: string;
  fromProviderId?: string;
  toProviderId?: string;
  receivableAmount?: number;
  payableAmount?: number;
  writeOffAmount: number;
  writeOffDate?: string;
  reason?: string;
  remark?: string;
}

export async function getWriteOffListApi(
  index: number,
  params?: Record<string, unknown>
) {
  return await http.request<CommonResult<PaginatedResponseDto<WriteOffOrder>>>(
    "get",
    baseUrlApi(`/write-off-order/${index}`),
    { params }
  );
}

export async function createWriteOffApi(data: CreateWriteOffDto) {
  return await http.request<CommonResult<WriteOffOrder>>(
    "post",
    baseUrlApi("/write-off-order"),
    { data }
  );
}

export async function approveWriteOffApi(uid: string) {
  return await http.request<CommonResult<void>>(
    "post",
    baseUrlApi(`/write-off-order/${uid}/approve`)
  );
}

export async function rejectWriteOffApi(uid: string) {
  return await http.request<CommonResult<void>>(
    "post",
    baseUrlApi(`/write-off-order/${uid}/reject`)
  );
}

export async function deleteWriteOffApi(uid: string) {
  return await http.request<CommonResult<void>>(
    "delete",
    baseUrlApi(`/write-off-order/${uid}`)
  );
}
