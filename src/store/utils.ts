export { store } from "@/store";
export { defineStore } from "pinia";
export { routerArrays, type RouteConfigs } from "@/layout/types";
export { router, resetRouter, constantMenus } from "@/router";

/**
 * 将 RouteConfigs[] 转换为 multiType[]
 * 过滤掉 path 或 name 为 undefined 的项
 */
export function toMultiTypeArray(
  routes: Array<{
    path?: string;
    name?: string;
    meta?: unknown;
    query?: unknown;
    params?: unknown;
  }>
): Array<{
  path: string;
  name: string;
  meta: Record<string, unknown>;
  query?: Record<string, string>;
  params?: Record<string, string>;
}> {
  return routes
    .filter(
      (r): r is typeof r & { path: string; name: string } =>
        r.path !== undefined && r.name !== undefined
    )
    .map(r => ({
      path: r.path,
      name: r.name,
      meta: (r.meta as Record<string, unknown>) ?? {},
      query: r.query as Record<string, string> | undefined,
      params: r.params as Record<string, string> | undefined
    }));
}
export { getConfig, responsiveStorageNameSpace } from "@/config";
export {
  ascending,
  filterTree,
  filterNoPermissionTree,
  formatFlatteningRoutes
} from "@/router/utils";
export {
  isUrl,
  isEqual,
  isNumber,
  debounce,
  isBoolean,
  getKeyList,
  storageLocal,
  deviceDetection
} from "@pureadmin/utils";
export type {
  setType,
  appType,
  userType,
  multiType,
  cacheType,
  positionType
} from "./types";
