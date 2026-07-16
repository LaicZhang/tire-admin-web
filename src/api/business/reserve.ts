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
  availableQuantity?: number;
  reservedQuantity?: number;
  pickedQuantity?: number;
  inTransitQuantity?: number;
  atpQuantity?: number;
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
  limit?: number;
  offset?: number;
}

export async function getReserveListApi(index: number, params?: ReserveQuery) {
  return await http.request<CommonResult<PaginatedResponseDto<Reserve>>>(
    "get",
    baseUrlApi(prefix + "page/" + index),
    { params }
  );
}
