/**
 * API 工厂函数 - 用于减少 CRUD 操作的重复代码
 */
import { http } from "@/utils/http";
import { baseUrlApi } from "./utils";
import type { CommonResult, PaginatedResponseDto } from "./type";

/**
 * CRUD API 配置选项
 */
export interface CrudApiOptions {
  /** 资源路径 */
  resource: string;
  /** 路径前缀（可选） */
  prefix?: string;
}

/**
 * 创建标准 CRUD API
 * @param options 配置选项
 * @returns CRUD 操作方法对象
 *
 * @example
 * ```ts
 * const customerApi = createCrudApi<CreateCustomerDto, UpdateCustomerDto, Customer>({
 *   resource: 'customer',
 *   prefix: '/business/'
 * });
 *
 * // 使用
 * customerApi.list(1);
 * customerApi.create({ name: 'test' });
 * customerApi.get('uid-123');
 * customerApi.update('uid-123', { name: 'updated' });
 * customerApi.delete('uid-123');
 * ```
 */
export function createCrudApi<
  TCreate,
  TUpdate,
  TResponse,
  TQuery = Record<string, unknown>
>(options: CrudApiOptions) {
  const { resource, prefix = "" } = options;
  const base = baseUrlApi(`${prefix}${resource}`);

  return {
    /**
     * 获取分页列表
     * @param page 页码
     * @param params 查询参数
     */
    list: (page: number, params?: TQuery) =>
      http.get<TQuery, CommonResult<PaginatedResponseDto<TResponse>>>(base, {
        params: { page, ...params }
      }),

    /**
     * 创建资源
     * @param data 创建数据
     */
    create: (data: TCreate) =>
      http.post<TCreate, CommonResult<TResponse>>(base, { data }),

    /**
     * 获取单个资源
     * @param uid 资源ID
     */
    get: (uid: string) =>
      http.get<void, CommonResult<TResponse>>(`${base}/${uid}`),

    /**
     * 更新资源
     * @param uid 资源ID
     * @param data 更新数据
     */
    update: (uid: string, data: TUpdate) =>
      http.patch<TUpdate, CommonResult<TResponse>>(`${base}/${uid}`, { data }),

    /**
     * 删除资源
     * @param uid 资源ID
     */
    delete: (uid: string) =>
      http.delete<void, CommonResult<void>>(`${base}/${uid}`)
  };
}

/**
 * 创建只读 API（不包含创建、更新、删除操作）
 * @param options 配置选项
 */
export function createReadOnlyApi<TResponse, TQuery = Record<string, unknown>>(
  options: CrudApiOptions
) {
  const { resource, prefix = "" } = options;
  const base = baseUrlApi(`${prefix}${resource}`);

  return {
    /**
     * 获取分页列表
     */
    list: (page: number, params?: TQuery) =>
      http.get<TQuery, CommonResult<PaginatedResponseDto<TResponse>>>(base, {
        params: { page, ...params }
      }),

    /**
     * 获取单个资源
     */
    get: (uid: string) =>
      http.get<void, CommonResult<TResponse>>(`${base}/${uid}`)
  };
}

/**
 * 创建带软删除的 CRUD API
 * @param options 配置选项
 */
export function createSoftDeleteCrudApi<
  TCreate,
  TUpdate,
  TResponse,
  TQuery = Record<string, unknown>
>(options: CrudApiOptions) {
  const crudApi = createCrudApi<TCreate, TUpdate, TResponse, TQuery>(options);
  const { resource, prefix = "" } = options;
  const base = baseUrlApi(`${prefix}${resource}`);

  return {
    ...crudApi,

    /**
     * 软删除资源
     * @param uid 资源ID
     */
    softDelete: (uid: string) =>
      http.patch<void, CommonResult<void>>(`${base}/${uid}/soft-delete`),

    /**
     * 恢复已删除的资源
     * @param uid 资源ID
     */
    restore: (uid: string) =>
      http.patch<void, CommonResult<TResponse>>(`${base}/${uid}/restore`)
  };
}
