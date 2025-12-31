import type { AuthItem } from "./types";

/**
 * 规范化授权项列表
 */
export function normalizeAuthItems(items: unknown): AuthItem[] {
  if (!Array.isArray(items)) return [];
  return items
    .map((item: unknown) => {
      if (typeof item !== "object" || item === null) {
        return null;
      }
      const obj = item as Record<string, unknown>;
      const uid = String(obj.uid ?? obj.id ?? "");
      const name = String(obj.name ?? obj.username ?? "");
      const code = String(obj.code ?? obj.id ?? obj.uid ?? "");
      const authTime = String(
        obj.authTime ?? obj.authAt ?? obj.createdAt ?? obj.createTime ?? ""
      );
      return { uid, name, code, authTime } satisfies AuthItem;
    })
    .filter((i): i is AuthItem => i !== null);
}
