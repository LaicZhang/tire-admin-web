/**
 * 路由查找相关工具函数
 */
import { isProxy, toRaw } from "vue";
import type { RouteRecordRaw } from "vue-router";
import type { menuType } from "@/layout/types";
import { useMultiTagsStoreHook } from "@/store/modules/multiTags";
import { usePermissionStoreHook } from "@/store/modules/permission";
import type { multiType } from "@/store/modules/types";

type ParentLookupKey = "path" | "name";

function toMenuMeta(route: RouteRecordRaw): menuType["meta"] {
  if (!route.meta) return undefined;
  return {
    title: typeof route.meta.title === "string" ? route.meta.title : undefined,
    icon: typeof route.meta.icon === "string" ? route.meta.icon : undefined,
    rank: typeof route.meta.rank === "number" ? route.meta.rank : undefined,
    showParent:
      typeof route.meta.showParent === "boolean"
        ? route.meta.showParent
        : undefined,
    extraIcon:
      typeof route.meta.extraIcon === "string"
        ? route.meta.extraIcon
        : undefined
  };
}

function toMenu(route: RouteRecordRaw): menuType | null {
  if (typeof route.path !== "string" || typeof route.name !== "string") {
    return null;
  }

  return {
    path: route.path,
    name: route.name,
    redirect: typeof route.redirect === "string" ? route.redirect : undefined,
    meta: toMenuMeta(route)
  };
}

function toMultiTag(route: menuType): multiType | null {
  if (!route.path || !route.name) return null;
  return {
    path: route.path,
    name: route.name,
    meta: {
      title: route.meta?.title,
      icon: route.meta?.icon,
      rank: route.meta?.rank,
      showParent: route.meta?.showParent
    },
    query: undefined,
    params: undefined
  };
}

/**
 * 通过指定 `key` 获取父级路径集合，默认 `key` 为 `path`
 */
export function getParentPaths(
  value: string,
  routes: readonly RouteRecordRaw[],
  key: ParentLookupKey = "path"
) {
  // 深度遍历查找
  function dfs(
    routes: readonly RouteRecordRaw[],
    value: string,
    parents: string[]
  ) {
    for (let i = 0; i < routes.length; i++) {
      const item = routes[i];
      // 返回父级path
      if (item[key] === value) return parents;
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
  routes: readonly RouteRecordRaw[]
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
export function getTopMenu(tag = false): menuType | null {
  const wholeMenus = usePermissionStoreHook().wholeMenus;
  // 菜单未加载时返回空对象，防止模板渲染时报错
  const firstMenu = wholeMenus?.[0];
  const firstChild = firstMenu?.children?.[0];
  if (!wholeMenus || wholeMenus.length === 0 || !firstChild) {
    return null;
  }
  const topMenu = toMenu(handleTopMenu(firstChild));
  if (!topMenu) return null;
  if (tag) {
    const nextTag = toMultiTag(topMenu);
    if (nextTag) useMultiTagsStoreHook().handleTags("push", nextTag);
  }
  return topMenu;
}
