import { http } from "../../utils/http";
import { baseUrlApi } from "../utils";
import type {
  CommonResult,
  PaginatedResponseDto,
  CountResponseDto
} from "../type";

const prefix = "/provider/";

/** 供应商查询参数 */
export interface ProviderQueryDto {
  keyword?: string;
  name?: string;
  desc?: string;
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
  name: string;
  phone?: string;
  address?: string;
  bankInfo?: string;
  desc?: string;
  status?: boolean;
  isIndividual?: boolean;
  isPublic?: boolean;
  contactName?: string;
  province?: string;
}

export async function getProviderListApi(
  index: number,
  params?: ProviderQueryDto
) {
  return await http.request<CommonResult<PaginatedResponseDto<Provider>>>(
    "get",
    baseUrlApi(prefix + "page/" + index),
    { params }
  );
}

export async function addProviderApi(data: ProviderDto | ProviderInputData) {
  return await http.request<CommonResult<Provider>>(
    "post",
    baseUrlApi(prefix),
    {
      data
    }
  );
}

export async function getProviderApi(uid: string) {
  return await http.request<CommonResult<Provider>>(
    "get",
    baseUrlApi(prefix + uid)
  );
}

export async function updateProviderApi(
  uid: string,
  data: Partial<ProviderDto> | ProviderInputData
) {
  return await http.request<CommonResult<Provider>>(
    "patch",
    baseUrlApi(prefix + uid),
    {
      data
    }
  );
}

export async function deleteProviderApi(uid: string) {
  return await http.request<CommonResult<void>>(
    "delete",
    baseUrlApi(prefix + uid)
  );
}

export async function getProviderCountApi() {
  return await http.request<CommonResult<CountResponseDto>>(
    "get",
    baseUrlApi(prefix + "count")
  );
}

export async function migrateProviderApi(uid: string, data: { uid: string }) {
  return await http.request<CommonResult<void>>(
    "patch",
    baseUrlApi(prefix + "migrate/" + uid),
    { data }
  );
}

/** 批量获取供应商 */
export async function getProviderBatchApi(uids: string[]) {
  return await http.request<CommonResult<Provider[]>>(
    "post",
    baseUrlApi(prefix + "batch"),
    { data: { uids } }
  );
}
