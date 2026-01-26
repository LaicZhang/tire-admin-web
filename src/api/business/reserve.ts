import { http } from "../../utils/http";
import { baseUrlApi } from "../utils";
import type { CommonResult, PaginatedResponseDto } from "../type";

const prefix = "/reserve/";

export interface ReserveDto {
  repoId: string;
  tireId: string;
  count: number;
  batchNo?: string;
  expiryDate?: string;
}

export interface Reserve extends ReserveDto {
  id: number;
  uid: string;
  repo?: { name: string };
  tire?: { name: string };
}

/** 库存查询参数 */
export interface ReserveQuery {
  repoId?: string;
  tireId?: string;
  batchNo?: string;
  keyword?: string;
}

export async function getReserveListApi(index: number, params?: ReserveQuery) {
  return await http.request<CommonResult<PaginatedResponseDto<Reserve>>>(
    "get",
    baseUrlApi(prefix + "page/" + index),
    { params }
  );
}

export async function addReserveApi(data: ReserveDto) {
  return await http.request<CommonResult<Reserve>>("post", baseUrlApi(prefix), {
    data
  });
}

export async function getReserveApi(id: number) {
  return await http.request<CommonResult<Reserve>>(
    "get",
    baseUrlApi(prefix + id)
  );
}

export async function updateReserveApi(id: number, data?: Partial<ReserveDto>) {
  return await http.request<CommonResult<Reserve>>(
    "patch",
    baseUrlApi(prefix + id),
    {
      data
    }
  );
}

export async function deleteReserveApi(id: number) {
  return await http.request<CommonResult<void>>(
    "delete",
    baseUrlApi(prefix + id)
  );
}

// 库存盘点 (单品)
export async function stockTakingApi(data: {
  repoId: string;
  tireId: string;
  actualCount: number;
  desc?: string;
}) {
  return await http.request<CommonResult<void>>(
    "post",
    baseUrlApi(prefix + "stock-taking"),
    { data }
  );
}

// 批量库存盘点
export async function batchStockTakingApi(data: {
  items: Array<{
    repoId: string;
    tireId: string;
    actualCount: number;
    desc?: string;
  }>;
}) {
  return await http.request<CommonResult<void>>(
    "post",
    baseUrlApi(prefix + "stock-taking/batch"),
    { data }
  );
}
