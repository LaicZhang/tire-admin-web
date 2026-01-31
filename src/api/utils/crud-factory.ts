import { http } from "../../utils/http";
import { baseUrlApi } from "../utils";
import type { CommonResult, PaginatedResponseDto } from "../type";

/**
 * CRUD API 配置选项
 */
export interface CrudFactoryOptions<
  _T,
  _QueryDto = Record<string, unknown>,
  _CreateDto = Record<string, unknown>
> {
  /** API 前缀，如 "/tire/" */
  prefix: string;
  /** 是否支持批量获取（默认 true） */
  enableBatch?: boolean;
  /** 是否支持恢复操作（默认 false） */
  enableRestore?: boolean;
  /** 自定义请求拦截器 */
  beforeRequest?: (method: string, data?: unknown) => unknown;
  /** 自定义响应拦截器 */
  afterResponse?: <R>(response: R) => R;
  /**
   * 类型占位字段：用于保留泛型信息，避免在批量工厂中丢失推断
   *（不会影响运行时）
   */
  __types?: { entity?: _T; query?: _QueryDto; create?: _CreateDto };
}

/**
 * CRUD API 返回类型
 */
export interface CrudApi<
  T,
  QueryDto = Record<string, unknown>,
  CreateDto = Record<string, unknown>
> {
  /** 分页查询列表 */
  getList: (
    index: number,
    params?: QueryDto
  ) => Promise<CommonResult<PaginatedResponseDto<T>>>;
  /** 创建 */
  add: (data: CreateDto) => Promise<CommonResult<T>>;
  /** 获取详情 */
  get: (uid: string) => Promise<CommonResult<T>>;
  /** 更新 */
  update: (uid: string, data: CreateDto) => Promise<CommonResult<T>>;
  /** 删除 */
  delete: (uid: string) => Promise<CommonResult<void>>;
  /** 批量获取（可选） */
  batch?: (uids: string[]) => Promise<CommonResult<T[]>>;
  /** 恢复（可选） */
  restore?: (uid: string) => Promise<CommonResult<T>>;
}

/**
 * 创建通用 CRUD API 工厂函数
 *
 * @example
 * ```typescript
 * // 定义类型
 * interface Tire {
 *   uid: string;
 *   name: string;
 *   createdAt: string;
 * }
 *
 * interface TireQueryDto {
 *   keyword?: string;
 *   group?: string;
 * }
 *
 * // 创建 API
 * export const tireApi = createCrudApi<Tire, TireQueryDto>({
 *   prefix: "/tire/"
 * });
 *
 * // 使用 API
 * const result = await tireApi.getList(1, { keyword: "test" });
 * const detail = await tireApi.get("uid-123");
 * await tireApi.add({ name: "New Tire" });
 * await tireApi.update("uid-123", { name: "Updated" });
 * await tireApi.delete("uid-123");
 * ```
 *
 * @template T - 实体类型
 * @template QueryDto - 查询参数类型
 * @param options - 配置选项
 * @returns CRUD API 对象
 */
export function createCrudApi<
  T,
  QueryDto = Record<string, unknown>,
  CreateDto = Record<string, unknown>
>(
  options: CrudFactoryOptions<T, QueryDto, CreateDto>
): CrudApi<T, QueryDto, CreateDto> {
  const {
    prefix,
    enableBatch = true,
    enableRestore = false,
    beforeRequest,
    afterResponse
  } = options;

  /**
   * 处理请求前的数据
   */
  const processRequest = (method: string, data?: unknown): unknown => {
    return beforeRequest ? beforeRequest(method, data) : data;
  };

  /**
   * 处理响应数据
   */
  const processResponse = <R>(response: R): R => {
    return afterResponse ? afterResponse(response) : response;
  };

  /**
   * 分页查询列表
   */
  const getList = async (
    index: number,
    params?: QueryDto
  ): Promise<CommonResult<PaginatedResponseDto<T>>> => {
    const requestData = processRequest("list", params);
    const response = await http.request<CommonResult<PaginatedResponseDto<T>>>(
      "get",
      baseUrlApi(prefix + "page/" + index),
      { params: requestData }
    );
    return processResponse(response);
  };

  /**
   * 创建
   */
  const add = async (data: CreateDto): Promise<CommonResult<T>> => {
    const requestData = processRequest("add", data);
    const response = await http.request<CommonResult<T>>(
      "post",
      baseUrlApi(prefix),
      {
        data: requestData
      }
    );
    return processResponse(response);
  };

  /**
   * 获取详情
   */
  const get = async (uid: string): Promise<CommonResult<T>> => {
    const requestData = processRequest("get", uid);
    const response = await http.request<CommonResult<T>>(
      "get",
      baseUrlApi(prefix + requestData)
    );
    return processResponse(response);
  };

  /**
   * 更新
   */
  const update = async (
    uid: string,
    data: CreateDto
  ): Promise<CommonResult<T>> => {
    const requestData = processRequest("update", data);
    const response = await http.request<CommonResult<T>>(
      "patch",
      baseUrlApi(prefix + uid),
      { data: requestData }
    );
    return processResponse(response);
  };

  /**
   * 删除
   */
  const del = async (uid: string): Promise<CommonResult<void>> => {
    const requestData = processRequest("delete", uid);
    const response = await http.request<CommonResult<void>>(
      "delete",
      baseUrlApi(prefix + requestData)
    );
    return processResponse(response);
  };

  /**
   * 批量获取
   */
  const batch = async (uids: string[]): Promise<CommonResult<T[]>> => {
    const requestData = processRequest("batch", { uids });
    const response = await http.request<CommonResult<T[]>>(
      "post",
      baseUrlApi(prefix + "batch"),
      { data: requestData }
    );
    return processResponse(response);
  };

  /**
   * 恢复
   */
  const restore = async (uid: string): Promise<CommonResult<T>> => {
    const requestData = processRequest("restore", uid);
    const response = await http.request<CommonResult<T>>(
      "post",
      baseUrlApi(prefix + "restore/" + requestData)
    );
    return processResponse(response);
  };

  const api: CrudApi<T, QueryDto, CreateDto> = {
    getList,
    add,
    get,
    update,
    delete: del
  };

  if (enableBatch) {
    api.batch = batch;
  }

  if (enableRestore) {
    api.restore = restore;
  }

  return api;
}

/**
 * 创建带扩展的 CRUD API（支持自定义方法）
 *
 * @example
 * ```typescript
 * export const tireApi = createExtendedCrudApi<Tire, TireQueryDto>({
 *   prefix: "/tire/",
 *   extensions: {
 *     getByBarcode: async (code: string) => {
 *       return await http.request<CommonResult<Tire>>(
 *         "get",
 *         baseUrlApi("/tire/barcode/" + code)
 *       );
 *     }
 *   }
 * });
 * ```
 */
export function createExtendedCrudApi<
  T,
  QueryDto = Record<string, unknown>,
  Extensions extends Record<string, unknown> = Record<string, unknown>
>(
  options: CrudFactoryOptions<T, QueryDto> & { extensions: Extensions }
): CrudApi<T, QueryDto> & Extensions {
  const baseApi = createCrudApi<T, QueryDto>(options);
  return { ...baseApi, ...options.extensions };
}

/**
 * 批量创建 CRUD API（用于创建多个相关 API）
 *
 * @example
 * ```typescript
 * const { customerApi, providerApi } = createCrudApis({
 *   customer: { prefix: "/customer/" },
 *   provider: { prefix: "/provider/" }
 * });
 * ```
 */
export function createCrudApis<
  T extends Record<string, CrudFactoryOptions<unknown, unknown>>
>(
  configs: T
): {
  [K in keyof T]: T[K] extends CrudFactoryOptions<infer E, infer Q>
    ? CrudApi<E, Q>
    : never;
} {
  type EntityOf<C> =
    C extends CrudFactoryOptions<infer E, infer _Q> ? E : never;
  type QueryOf<C> = C extends CrudFactoryOptions<infer _E, infer Q> ? Q : never;
  type Result = {
    [K in keyof T]: T[K] extends CrudFactoryOptions<infer E, infer Q>
      ? CrudApi<E, Q>
      : never;
  };

  const result = {} as Result;
  const keys = Object.keys(configs) as Array<keyof T>;
  for (const key of keys) {
    result[key] = createCrudApi<
      EntityOf<T[typeof key]>,
      QueryOf<T[typeof key]>
    >(
      configs[key] as unknown as CrudFactoryOptions<
        EntityOf<T[typeof key]>,
        QueryOf<T[typeof key]>
      >
    ) as Result[typeof key];
  }
  return result;
}
