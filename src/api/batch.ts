import { http } from "../utils/http";
import { baseUrlApi } from "./utils";
import type { CommonResult } from "./type";
import { unsupportedBackendRoute } from "./route-gap";

const prefix = "/batch/";

// 创建批次
export async function createBatchApi(data: {
  repoId: string;
  tireId: string;
  batchNo: string;
  quantity: number;
  productionDate?: string;
  expiryDate?: string;
}) {
  return await http.request<CommonResult>("post", baseUrlApi(prefix), {
    data
  });
}

// 查询批次列表
export async function getBatchListApi<T = Batch[]>(params?: {
  repoId?: string;
  tireId?: string;
  batchNo?: string;
}) {
  return await http.request<CommonResult<T>>("get", baseUrlApi(prefix), {
    params
  });
}

/** 批次信息 */
export interface Batch {
  id: number;
  uid: string;
  batchNo: string;
  tireId: string;
  tireName?: string;
  repoId: string;
  repoName?: string;
  quantity: number;
  productionDate?: string;
  expiryDate?: string;
  createdAt?: string;
}

/** 后端没有 PUT /batch/:id。 */
export async function updateBatchApi(
  _id: number,
  _data: {
    batchNo?: string;
    quantity?: number;
    productionDate?: string;
    expiryDate?: string;
  }
) {
  return unsupportedBackendRoute("PUT /batch/:id");
}

/** 后端没有 DELETE /batch/:id。 */
export async function deleteBatchApi(_id: number) {
  return unsupportedBackendRoute("DELETE /batch/:id");
}

// 记录批次出入库流水
export async function recordBatchTransactionApi(
  id: number,
  data: {
    type: "IN" | "OUT";
    quantity: number;
    sourceType?: string;
    sourceId?: string;
  }
) {
  return await http.request<CommonResult>(
    "post",
    baseUrlApi(prefix + `${id}/transaction`),
    { data }
  );
}

// 查看批次流水
export async function getBatchTransactionsApi(id: number) {
  return await http.request<CommonResult>(
    "get",
    baseUrlApi(prefix + `${id}/transactions`)
  );
}
