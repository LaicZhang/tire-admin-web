import { http } from "@/utils/http";
import { baseUrlApi } from "../utils";
import type { CommonResult, PaginatedResponseDto } from "../type";

export interface InitialStockRecord {
  id?: number;
  uid: string;
  tireId: string;
  repoId: string;
  quantity: number;
  costPrice?: number;
  batchNo?: string;
  remark?: string;
  createdAt?: string;
  tire?: { uid?: string; name?: string };
  repo?: { uid?: string; name?: string };
}

export interface InitialStockUpsertDto {
  uid?: string;
  tireId: string;
  repoId: string;
  quantity: number;
  costPrice?: number;
  batchNo?: string;
  remark?: string;
}

export interface InitialStockQuery {
  tireId?: string;
  repoId?: string;
  keyword?: string;
  pageSize?: number;
}

const prefix = "/data-config/initial-stock";

export async function getInitialStockListApi(
  index: number,
  params?: InitialStockQuery
) {
  return await http.request<
    CommonResult<PaginatedResponseDto<InitialStockRecord>>
  >("get", baseUrlApi(`${prefix}/page/${index}`), { params });
}

export async function upsertInitialStockApi(record: InitialStockUpsertDto) {
  return await http.request<CommonResult<InitialStockRecord>>(
    record.uid ? "patch" : "post",
    baseUrlApi(record.uid ? `${prefix}/${record.uid}` : prefix),
    { data: record }
  );
}

export async function deleteInitialStockApi(uid: string) {
  return await http.request<CommonResult<void>>(
    "delete",
    baseUrlApi(`${prefix}/${uid}`)
  );
}
