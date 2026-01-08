/**
 * 前端类型守卫工具函数
 * 用于验证 API 响应和替代不安全的类型断言
 */

// ==========================================
// 通用验证函数
// ==========================================

/**
 * 检查值是否为非空对象
 */
export function isObject(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

/**
 * 检查值是否为非空数组
 */
export function isNonEmptyArray<T>(value: unknown): value is T[] {
  return Array.isArray(value) && value.length > 0;
}

// ==========================================
// API 响应验证
// ==========================================

/**
 * 分页响应结构
 */
export interface PaginatedResponse<T> {
  list: T[];
  count: number;
}

/**
 * 验证分页响应结构
 * @param data 待验证数据
 * @param itemValidator 可选的列表项验证函数
 */
export function isPaginatedResponse<T>(
  data: unknown,
  itemValidator?: (item: unknown) => item is T
): data is PaginatedResponse<T> {
  if (!isObject(data)) return false;
  if (!Array.isArray(data.list)) return false;
  if (typeof data.count !== "number") return false;

  // 如果提供了列表项验证函数，则验证每一项
  if (itemValidator) {
    return data.list.every(itemValidator);
  }

  return true;
}

/**
 * 从 API 响应中安全提取分页数据
 * 如果验证失败，返回空列表
 */
export function extractPaginatedList<T>(
  data: unknown,
  itemValidator?: (item: unknown) => item is T
): PaginatedResponse<T> {
  if (isPaginatedResponse(data, itemValidator)) {
    return data;
  }
  return { list: [], count: 0 };
}

// ==========================================
// 订单相关类型守卫
// ==========================================

/**
 * 订单基础字段
 */
export interface BaseOrder {
  uid: string;
  status?: string;
  isApproved?: boolean | null;
  isLocked?: boolean | null;
  createdAt?: string;
}

/**
 * 验证订单基础字段
 */
export function isBaseOrder(item: unknown): item is BaseOrder {
  if (!isObject(item)) return false;
  return typeof item.uid === "string";
}

/**
 * 库存单据基础字段
 */
export interface InventoryDocument extends BaseOrder {
  docNo?: string;
  type?: string;
  repoId?: string;
}

/**
 * 验证库存单据结构
 */
export function isInventoryDocument(item: unknown): item is InventoryDocument {
  if (!isBaseOrder(item)) return false;
  return true; // 其他字段都是可选的
}

// ==========================================
// 安全类型转换工具
// ==========================================

/**
 * 安全类型转换
 * 使用类型守卫验证后再转换，如验证失败则返回默认值
 */
export function safeCast<T>(
  data: unknown,
  validator: (data: unknown) => data is T,
  fallback: T
): T {
  return validator(data) ? data : fallback;
}

/**
 * 安全类型转换（抛出错误版本）
 * 使用类型守卫验证后再转换，如验证失败则抛出错误
 */
export function safeCastOrThrow<T>(
  data: unknown,
  validator: (data: unknown) => data is T,
  errorMessage: string
): T {
  if (validator(data)) {
    return data;
  }
  throw new Error(errorMessage);
}

// ==========================================
// 属性提取工具
// ==========================================

/**
 * 安全提取字符串属性
 */
export function extractString(
  obj: unknown,
  key: string,
  fallback = ""
): string {
  if (!isObject(obj)) return fallback;
  const value = obj[key];
  return typeof value === "string" ? value : fallback;
}

/**
 * 安全提取数字属性
 */
export function extractNumber(obj: unknown, key: string, fallback = 0): number {
  if (!isObject(obj)) return fallback;
  const value = obj[key];
  return typeof value === "number" ? value : fallback;
}

/**
 * 安全提取布尔属性
 */
export function extractBoolean(
  obj: unknown,
  key: string,
  fallback = false
): boolean {
  if (!isObject(obj)) return fallback;
  const value = obj[key];
  return typeof value === "boolean" ? value : fallback;
}

/**
 * 安全提取数组属性
 */
export function extractArray<T>(
  obj: unknown,
  key: string,
  itemValidator?: (item: unknown) => item is T
): T[] {
  if (!isObject(obj)) return [];
  const value = obj[key];
  if (!Array.isArray(value)) return [];
  if (itemValidator) {
    return value.filter(itemValidator);
  }
  return value as T[];
}

// ==========================================
// 路由类型守卫
// ==========================================

/**
 * 路由记录基础结构
 */
export interface RouteRecordBasic {
  path: string;
  name?: string;
  meta?: Record<string, unknown>;
  children?: RouteRecordBasic[];
}

/**
 * 验证路由记录结构
 */
export function isRouteRecord(item: unknown): item is RouteRecordBasic {
  if (!isObject(item)) return false;
  return typeof item.path === "string";
}

/**
 * 验证路由记录数组
 */
export function isRouteRecordArray(data: unknown): data is RouteRecordBasic[] {
  if (!Array.isArray(data)) return false;
  return data.every(isRouteRecord);
}
