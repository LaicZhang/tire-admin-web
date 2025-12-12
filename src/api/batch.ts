import { http } from "../utils/http";
import { baseUrlApi } from "./utils";
import type { CommonResult } from "./type";

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
export async function getBatchListApi(params?: {
  repoId?: string;
  tireId?: string;
  batchNo?: string;
}) {
  return await http.request<CommonResult>("get", baseUrlApi(prefix), {
    params
  });
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
