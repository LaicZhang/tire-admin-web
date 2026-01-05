/**
 * 路由查找相关工具函数
 */
import { isProxy, toRaw } from "vue";
import type { RouteRecordRaw } from "vue-router";
import type { menuType } from "@/layout/types";
import { useMultiTagsStoreHook } from "@/store/modules/multiTags";
import { usePermissionStoreHook } from "@/store/modules/permission";
import type { multiType } from "@/store/modules/types";

/**
 * 通过指定 `key` 获取父级路径集合，默认 `key` 为 `path`
 */
export function getParentPaths(
  value: string,
  routes: RouteRecordRaw[],
  key = "path"
) {
  // 深度遍历查找
  function dfs(routes: RouteRecordRaw[], value: string, parents: string[]) {
    for (let i = 0; i < routes.length; i++) {
      const item = routes[i];
      // 返回父级path
      // Dynamic key access on route record
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      if ((item as any)[key] === value) return parents;
      // children不存在或为空则不递归
      if (!item.children || !item.children.length) continue;
      // 往下查找时将当前path入栈
      parents.push(item.path);

      if (dfs(item.children, value, parents).length) return parents;
      // 深度遍历查找未找到时当前path 出栈
      parents.pop();
    }
    // 未找到时返回空数组
    return [];
  }

  return dfs(routes, value, []);
}

/**
 * 查找对应 `path` 的路由信息
 */
export function findRouteByPath(
  path: string,
  routes: RouteRecordRaw[]
): RouteRecordRaw | null {
  let res: RouteRecordRaw | null | undefined = routes.find(
    item => item.path === path
  );
  if (res) {
    return isProxy(res) ? toRaw(res) : res;
  } else {
    for (let i = 0; i < routes.length; i++) {
      const children = routes[i].children;
      if (Array.isArray(children) && children.length > 0) {
        res = findRouteByPath(path, children);
        if (res) {
          return isProxy(res) ? toRaw(res) : res;
        }
      }
    }
    return null;
  }
}

function handleTopMenu(route: RouteRecordRaw) {
  if (route?.children && route.children.length > 1) {
    const match = route.redirect
      ? route.children.find(cur => cur.path === route.redirect)
      : undefined;
    return match ?? route.children[0];
  } else {
    return route;
  }
}

/**
 * 获取所有菜单中的第一个菜单（顶级菜单）
 */
export function getTopMenu(tag = false): menuType {
  const wholeMenus = usePermissionStoreHook()
    .wholeMenus as unknown as RouteRecordRaw[];
  // 菜单未加载时返回空对象，防止模板渲染时报错
  const firstMenu = wholeMenus?.[0];
  const firstChild = firstMenu?.children?.[0];
  if (!wholeMenus || wholeMenus.length === 0 || !firstChild) {
    return {} as menuType;
  }
  const topMenu = handleTopMenu(firstChild) as unknown as menuType;
  if (tag && topMenu.path && topMenu.name) {
    useMultiTagsStoreHook().handleTags("push", {
      path: topMenu.path,
      name: topMenu.name,
      meta: topMenu.meta ?? {},
      query: undefined,
      params: undefined
    } as multiType);
  }
  return topMenu;
}
