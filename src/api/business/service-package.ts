import { http } from "../../utils/http";
import { baseUrlApi } from "../utils";
import type { CommonResult, PaginatedResponseDto } from "../type";

export interface ServicePackageLine {
  uid?: string;
  tireId: string;
  qty: number;
  optional?: boolean;
  sortOrder?: number;
  unitPrice?: number | string | null;
  remark?: string | null;
  tire?: {
    uid?: string;
    name?: string | null;
    productType?: string | null;
  } | null;
}

export interface ServicePackageItem {
  uid: string;
  companyId?: string;
  name: string;
  enabled: boolean;
  remark?: string | null;
  createAt?: string;
  updateAt?: string;
  lines: ServicePackageLine[];
}

export interface CreateServicePackagePayload {
  name: string;
  enabled?: boolean;
  remark?: string | null;
  lines: Array<{
    tireId: string;
    qty: number;
    optional?: boolean;
    sortOrder?: number;
    unitPrice?: number | null;
    remark?: string | null;
  }>;
}

export type UpdateServicePackagePayload = Partial<CreateServicePackagePayload>;

const prefix = "/service-package";

export function getServicePackageListApi(
  index: number,
  params?: { keyword?: string; enabled?: boolean }
) {
  return http.request<CommonResult<PaginatedResponseDto<ServicePackageItem>>>(
    "get",
    baseUrlApi(`${prefix}/page/${index}`),
    { params }
  );
}

export function getServicePackageApi(uid: string) {
  return http.request<CommonResult<ServicePackageItem>>(
    "get",
    baseUrlApi(`${prefix}/${uid}`)
  );
}

export function createServicePackageApi(data: CreateServicePackagePayload) {
  return http.request<CommonResult<ServicePackageItem>>(
    "post",
    baseUrlApi(prefix),
    { data }
  );
}

export function updateServicePackageApi(
  uid: string,
  data: UpdateServicePackagePayload
) {
  return http.request<CommonResult<ServicePackageItem>>(
    "patch",
    baseUrlApi(`${prefix}/${uid}`),
    { data }
  );
}

export function deleteServicePackageApi(uid: string) {
  return http.request<CommonResult<ServicePackageItem>>(
    "delete",
    baseUrlApi(`${prefix}/${uid}`)
  );
}
