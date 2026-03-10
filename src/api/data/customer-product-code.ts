import { http } from "@/utils/http";
import { baseUrlApi } from "../utils";
import type { CommonResult, PaginatedResponseDto } from "../type";

export interface CustomerProductCodeRecord {
  id: number;
  uid: string;
  customerId: string;
  tireId: string;
  customerCode: string;
  customerProductName?: string;
  remark?: string;
  createdAt?: string;
}

export interface CustomerProductCodeQuery {
  customerId?: string;
  tireId?: string;
  keyword?: string;
}

export interface CustomerProductCodeUpsertDto {
  uid?: string;
  customerId: string;
  tireId: string;
  customerCode: string;
  customerProductName?: string;
  remark?: string;
}

const prefix = "/data-config/customer-product-code";

export async function getCustomerProductCodeListApi(
  index: number,
  params?: CustomerProductCodeQuery & { pageSize?: number }
): Promise<CommonResult<PaginatedResponseDto<CustomerProductCodeRecord>>> {
  return await http.request<
    CommonResult<PaginatedResponseDto<CustomerProductCodeRecord>>
  >("get", baseUrlApi(`${prefix}/page/${index}`), { params });
}

export async function upsertCustomerProductCodeApi(
  dto: CustomerProductCodeUpsertDto
): Promise<CommonResult<CustomerProductCodeRecord>> {
  return await http.request<CommonResult<CustomerProductCodeRecord>>(
    dto.uid ? "patch" : "post",
    baseUrlApi(dto.uid ? `${prefix}/${dto.uid}` : prefix),
    { data: dto }
  );
}

export async function deleteCustomerProductCodeApi(
  uid: string
): Promise<CommonResult<void>> {
  return await http.request<CommonResult<void>>(
    "delete",
    baseUrlApi(`${prefix}/${uid}`)
  );
}
