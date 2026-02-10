/**
 * 安全解析列表数据：支持数组或 { list: T[] } 格式
 */
export function parseListData<T>(data: unknown): T[] {
  if (Array.isArray(data)) return data as T[];
  if (data && typeof data === "object" && "list" in data) {
    const list = (data as { list?: unknown }).list;
    if (Array.isArray(list)) return list as T[];
  }
  return [];
}
