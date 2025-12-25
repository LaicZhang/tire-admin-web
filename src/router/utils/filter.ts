/**
 * 路由过滤相关工具函数
 */
import { cloneDeep, intersection, storageLocal } from "@pureadmin/utils";
import { userKey, type DataInfo } from "@/utils/auth";

/** 路由信息接口 */
interface RouteInfo {
  name?: string;
  path: string;
  parentId?: string;
  meta?: {
    rank?: number;
    showLink?: boolean;
    roles?: string[];
    [key: string]: unknown;
  };
  children?: RouteInfo[];
}

/**
 * 判断两个数组彼此是否存在相同值
 * @param a - 第一个字符串数组
 * @param b - 第二个字符串数组
 * @returns 如果两个数组有交集则返回 true，否则返回 false；如果任一参数不是数组则返回 true
 */
export function isOneOfArray(a: Array<string>, b: Array<string>) {
  return Array.isArray(a) && Array.isArray(b)
    ? intersection(a, b).length > 0
      ? true
      : false
    : true;
}

/**
 * 判断路由是否需要自动分配 rank
 * @param routeInfo - 路由信息对象
 * @returns 如果路由需要自动分配 rank 则返回 true
 * @internal
 */
function handRank(routeInfo: RouteInfo): boolean {
  const { name, path, parentId, meta } = routeInfo;
  return (
    !parentId &&
    (!meta?.rank || (meta?.rank === 0 && name !== "Home" && path !== "/"))
  );
}

/**
 * 按照路由中 meta.rank 等级升序来排序路由
 * @param arr - 待排序的路由数组
 * @returns 排序后的路由数组（会修改原数组）
 * @remarks 当 rank 不存在时，会根据顺序自动创建，首页路由永远在第一位
 */
export function ascending(arr: RouteInfo[]): RouteInfo[] {
  arr.forEach((v, index) => {
    // 当rank不存在时，根据顺序自动创建，首页路由永远在第一位
    if (handRank(v)) {
      if (v.meta) v.meta.rank = index + 2;
    }
  });
  return arr.sort((a, b) => {
    const rankA = a?.meta?.rank ?? 0;
    const rankB = b?.meta?.rank ?? 0;
    return rankA - rankB;
  });
}

/**
 * 过滤 meta.showLink 为 false 的菜单
 * @param data - 原始路由树数据
 * @returns 过滤后的路由树（深拷贝，不修改原数据）
 */
export function filterTree(data: RouteInfo[]): RouteInfo[] {
  const newTree = cloneDeep(data).filter(
    (v: RouteInfo) => v.meta?.showLink !== false
  );
  newTree.forEach(
    (v: RouteInfo) => v.children && (v.children = filterTree(v.children))
  );
  return newTree;
}

/**
 * 过滤 children 长度为 0 的目录
 * @param data - 原始路由树数据
 * @returns 过滤后的路由树（深拷贝，不修改原数据）
 */
export function filterChildrenTree(data: RouteInfo[]): RouteInfo[] {
  const newTree = cloneDeep(data).filter(
    (v: RouteInfo) => v?.children?.length !== 0
  );
  newTree.forEach(
    (v: RouteInfo) => v.children && (v.children = filterTree(v.children))
  );
  return newTree;
}

/**
 * 从 localStorage 里取出当前登录用户的角色 roles，过滤无权限的菜单
 * @param data - 原始路由树数据
 * @returns 过滤后只包含有权限访问的路由树
 * @remarks 会递归处理子路由，并自动移除空目录
 */
export function filterNoPermissionTree(data: RouteInfo[]): RouteInfo[] {
  const currentRoles =
    storageLocal().getItem<DataInfo<number>>(userKey)?.roles ?? [];
  const newTree = cloneDeep(data).filter((v: RouteInfo) =>
    isOneOfArray(v.meta?.roles ?? [], currentRoles)
  );
  newTree.forEach(
    (v: RouteInfo) =>
      v.children && (v.children = filterNoPermissionTree(v.children))
  );
  return filterChildrenTree(newTree);
}
