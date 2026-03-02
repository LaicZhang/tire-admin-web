/**
 * 参数过滤工具函数
 * 用于在 API 请求前清理空值参数
 */

/**
 * 过滤空值参数
 * 移除空字符串、undefined、null 值
 *
 * @param params - 原始参数对象
 * @returns 过滤后的参数对象
 *
 * @example
 * ```ts
 * const params = { name: "", status: undefined, id: "123" };
 * const filtered = filterEmptyParams(params);
 * // 结果: { id: "123" }
 * ```
 */
export function filterEmptyParams<T extends Record<string, unknown>>(
  params: T
): Partial<T> {
  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(params)) {
    if (value !== "" && value !== undefined && value !== null) {
      result[key] = value;
    }
  }
  return result as Partial<T>;
}

/**
 * 过滤空值参数（保留空数组）
 * 与 filterEmptyParams 类似，但保留空数组（用于某些需要清空筛选的场景）
 *
 * @param params - 原始参数对象
 * @returns 过滤后的参数对象
 */
export function filterEmptyParamsKeepArrays<T extends Record<string, unknown>>(
  params: T
): Partial<T> {
  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(params)) {
    // 保留数组（包括空数组）
    if (Array.isArray(value)) {
      result[key] = value;
    } else if (value !== "" && value !== undefined && value !== null) {
      result[key] = value;
    }
  }
  return result as Partial<T>;
}
