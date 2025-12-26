import { http } from "@/utils/http";
import { baseUrlApi } from "../utils";
import type { CommonResult } from "../type";

const prefix = "/serial-number";

/** 序列号状态 */
export type SerialNumberStatus = "IN_STOCK" | "SOLD" | "RETURNED" | "SCRAPPED";

/** 序列号 */
export interface SerialNumber {
  id: number;
  uid: string;
  serialNo: string;
  tireId: string;
  repoId: string;
  status: SerialNumberStatus;
  sourceType?: string;
  sourceOrderId?: string;
  targetType?: string;
  targetOrderId?: string;
  batchNo?: string;
  productionDate?: string;
  expiryDate?: string;
  createdAt: string;
  tire?: { name: string };
  repo?: { name: string };
}

/** 序列号流转日志 */
export interface SerialNumberLog {
  id: number;
  serialNumberId: number;
  action: string;
  fromRepoId?: string;
  toRepoId?: string;
  orderType?: string;
  orderId?: string;
  operatorId: string;
  createdAt: string;
}

/** 获取序列号列表 */
export function getSerialNumberList(params?: {
  index?: number;
  tireId?: string;
  repoId?: string;
  status?: string;
  keyword?: string;
}) {
  return http.request<CommonResult<{ count: number; list: SerialNumber[] }>>(
    "get",
    baseUrlApi(prefix),
    { params }
  );
}

/** 获取序列号详情 */
export function getSerialNumberDetail(serialNo: string) {
  return http.request<CommonResult<SerialNumber>>(
    "get",
    baseUrlApi(`${prefix}/${serialNo}`)
  );
}

/** 获取序列号流转记录 */
export function getSerialNumberLogs(serialNo: string) {
  return http.request<CommonResult<SerialNumberLog[]>>(
    "get",
    baseUrlApi(`${prefix}/${serialNo}/logs`)
  );
}

/** 创建序列号 */
export function createSerialNumber(data: {
  serialNo: string;
  tireId: string;
  repoId: string;
  sourceType?: string;
  sourceOrderId?: string;
  batchNo?: string;
  productionDate?: string;
  expiryDate?: string;
}) {
  return http.request<CommonResult<SerialNumber>>("post", baseUrlApi(prefix), {
    data
  });
}

/** 批量创建序列号 */
export function createSerialNumberBatch(data: {
  serialNos: string[];
  tireId: string;
  repoId: string;
  sourceType?: string;
  sourceOrderId?: string;
}) {
  return http.request<
    CommonResult<Array<{ serialNo: string; success: boolean; error?: string }>>
  >("post", baseUrlApi(`${prefix}/batch`), { data });
}

/** 销售出库 */
export function sellSerialNumber(serialNo: string, saleOrderId: string) {
  return http.request<CommonResult<SerialNumber>>(
    "post",
    baseUrlApi(`${prefix}/${serialNo}/sell`),
    { data: { saleOrderId } }
  );
}

/** 退货入库 */
export function returnSerialNumber(
  serialNo: string,
  returnOrderId: string,
  repoId: string
) {
  return http.request<CommonResult<SerialNumber>>(
    "post",
    baseUrlApi(`${prefix}/${serialNo}/return`),
    { data: { returnOrderId, repoId } }
  );
}

/** 调拨 */
export function transferSerialNumber(
  serialNo: string,
  toRepoId: string,
  transferOrderId: string
) {
  return http.request<CommonResult<SerialNumber>>(
    "post",
    baseUrlApi(`${prefix}/${serialNo}/transfer`),
    { data: { toRepoId, transferOrderId } }
  );
}
