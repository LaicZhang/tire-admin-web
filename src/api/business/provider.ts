import { http } from "../../utils/http";
import { baseUrlApi } from "../utils";
import type { CommonResult, CountResponseDto } from "../type";
import { createCrudApi } from "../utils/crud-factory";
import type { BalanceAdjustment } from "./balanceAdjustment";

const prefix = "/provider/";

/** 供应商查询参数 */
export interface ProviderQueryDto {
  keyword?: string;
  name?: string;
  desc?: string;
  scope?: "nonDeleted" | "deleted" | "all";
}

/** Prisma 关联连接类型 */
interface PrismaConnect<T> {
  connect?: T;
}

/** 供应商创建/更新输入数据 */
export interface ProviderInputData {
  name?: string;
  phone?: string;
  address?: string;
  bankInfo?: string;
  desc?: string;
  status?: boolean;
  isIndividual?: boolean;
  isPublic?: boolean;
  contactName?: string;
  province?: string;
  initialPayable?: number;
  /** Prisma 关联 - 公司 */
  company?: PrismaConnect<{ uid: string }>;
  /** Prisma 关联 - 操作人 */
  operator?: PrismaConnect<{ uid: string }>;
}

/** 供应商创建/更新 DTO - 支持嵌套 provider 形式 */
export interface ProviderDto {
  provider?: ProviderInputData;
  // 兼容直接传递字段的形式
  name?: string;
  phone?: string;
  address?: string;
  bankInfo?: string;
  desc?: string;
}

/** 供应商实体 */
export interface Provider {
  id: number;
  uid: string;
  code?: string;
  name: string;
  phone?: string;
  address?: string;
  bankInfo?: string;
  desc?: string;
  status?: boolean;
  deleteAt?: string | null;
  isIndividual?: boolean;
  isPublic?: boolean;
  contactName?: string;
  province?: string;
  payableBalance?: number;
}

// ============ 标准 CRUD API (使用工厂函数) ============

const baseProviderApi = createCrudApi<Provider, ProviderQueryDto, ProviderDto>({
  prefix: prefix,
  enableBatch: true,
  enableRestore: true
});

/** 获取供应商分页列表 */
export const getProviderListApi = baseProviderApi.getList;

/** 创建供应商 */
export const addProviderApi = baseProviderApi.add;

/** 获取供应商详情 */
export const getProviderApi = baseProviderApi.get;

/** 更新供应商 */
export const updateProviderApi = baseProviderApi.update;

/** 删除供应商 */
export const deleteProviderApi = baseProviderApi.delete;

/** 恢复供应商 */
export const restoreProviderApi = baseProviderApi.restore as NonNullable<
  typeof baseProviderApi.restore
>;

/** 批量获取供应商 */
export const getProviderBatchApi = baseProviderApi.batch as NonNullable<
  typeof baseProviderApi.batch
>;

// ============ 扩展 API ============

/** 获取供应商数量 */
export async function getProviderCountApi() {
  return await http.request<CommonResult<CountResponseDto>>(
    "get",
    baseUrlApi(prefix + "count")
  );
}

/** 迁移供应商 */
export async function migrateProviderApi(uid: string, data: { uid: string }) {
  return await http.request<CommonResult<void>>(
    "patch",
    baseUrlApi(prefix + "migrate/" + uid),
    { data }
  );
}

export function getProviderBalanceHistoryApi(
  uid: string,
  params?: { index?: number; pageSize?: number }
) {
  return http.request<
    CommonResult<{
      count: number;
      list: BalanceAdjustment[];
    }>
  >("get", baseUrlApi(prefix + `${uid}/balance-history`), { params });
}
