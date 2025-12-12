import { http } from "../../utils/http";
import { baseUrlApi } from "../utils";
import type { CommonResult } from "../type";

const prefix = "/reserve/";

export async function getReserveListApi(index: number, params?: object) {
  return await http.request<CommonResult>(
    "get",
    baseUrlApi(prefix + "page/" + index),
    { params }
  );
}

export async function addReserveApi(data: object) {
  return await http.request<CommonResult>("post", baseUrlApi(prefix), {
    data
  });
}

export async function getReserveApi(id: number) {
  return await http.request<CommonResult>("get", baseUrlApi(prefix + id));
}

export async function updateReserveApi(id: number, data?: object) {
  return await http.request<CommonResult>("patch", baseUrlApi(prefix + id), {
    data
  });
}

export async function deleteReserveApi(id: number) {
  return await http.request<CommonResult>("delete", baseUrlApi(prefix + id));
}

// 库存盘点 (单品)
export async function stockTakingApi(data: {
  repoId: string;
  tireId: string;
  actualCount: number;
  desc?: string;
}) {
  return await http.request<CommonResult>(
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
  return await http.request<CommonResult>(
    "post",
    baseUrlApi(prefix + "stock-taking/batch"),
    { data }
  );
}
