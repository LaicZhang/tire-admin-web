/**
 * 动态路由处理相关工具函数
 */
import {
  type RouterHistory,
  type RouteRecordRaw,
  type RouteRecordNormalized,
  createWebHistory,
  createWebHashHistory
} from "vue-router";
import { isString } from "@pureadmin/utils";
import { router } from "../index";
import { routerArrays } from "@/layout/types";
import { buildHierarchyTree } from "@/utils/tree";
import { useMultiTagsStoreHook } from "@/store/modules/multiTags";
import { usePermissionStoreHook } from "@/store/modules/permission";
import { ascending } from "./filter";

const IFrame = () => import("@/layout/frameView.vue");

// https://cn.vitejs.dev/guide/features.html#glob-import
const modulesRoutes = import.meta.glob("/src/views/**/*.{vue,tsx}");
const modulesRoutesKeys = Object.keys(modulesRoutes);

function extractImportPath(component: string): string {
  const match = component.match(/import\((['"`])([^'"`]+)\1\)/);
  return (match?.[2] ?? component).trim();
}

function getViewsRelativePath(componentPath: string): string | null {
  const match = componentPath.match(/(\/views\/.*\.(?:vue|tsx))/);
  if (match?.[1]) return match[1];
  // "@/views/xx" | "views/xx"
  const cleaned = componentPath
    .replace(/^@\//, "/")
    .replace(/^views\//, "/views/");
  const match2 = cleaned.match(/(\/views\/.*\.(?:vue|tsx))/);
  return match2?.[1] ?? null;
}

function resolveViewsModuleKeyByComponent(component: unknown): string | null {
  if (!isString(component)) return null;
  const componentPath = extractImportPath(component);
  const viewsRelativePath = getViewsRelativePath(componentPath);
  if (viewsRelativePath) {
    const hit = modulesRoutesKeys.find(k => k.includes(viewsRelativePath));
    if (hit) return hit;
  }

  const normalized = componentPath
    .replace(/^@\//, "/src/")
    .replace(/^src\//, "/src/");
  const hit = modulesRoutesKeys.find(
    k => k === normalized || k.includes(normalized)
  );
  return hit ?? null;
}

function resolveViewsModuleKeyByRoutePath(routePath: string): string | null {
  const candidates = [`${routePath}/index.`, `${routePath}.`, routePath];
  for (const candidate of candidates) {
    const hit = modulesRoutesKeys.find(k => k.includes(candidate));
    if (hit) return hit;
  }
  return null;
}

/**
 * 添加 404 路径匹配路由
 * @remarks 该路由用于捕获所有未匹配的路径并重定向到 404 错误页面
 */
export function addPathMatch() {
  if (!router.hasRoute("pathMatch")) {
    router.addRoute({
      path: "/:pathMatch(.*)",
      name: "pathMatch",
      redirect: "/error/404"
    });
  }
}

/**
 * 处理动态路由（后端返回的路由）
 * @param routeList - 后端返回的路由配置数组
 * @remarks
 * - 将路由添加到路由器并更新权限存储
 * - 自动处理路由排序和标签页缓存
 * - 添加 404 路径匹配作为最后一个路由
 */
export function handleAsyncRoutes(routeList: RouteRecordRaw[]): void {
  if (routeList.length === 0) {
    usePermissionStoreHook().handleWholeMenus(routeList);
  } else {
    formatFlatteningRoutes(addAsyncRoutes(routeList)).map(
      (v: RouteRecordRaw) => {
        // 防止重复添加路由
        if (
          router.options.routes[0]?.children?.findIndex(
            value => value.path === v.path
          ) !== -1
        ) {
          return;
        } else {
          // 切记将路由push到routes后还需要使用addRoute，这样路由才能正常跳转
          router.options.routes[0]?.children?.push(v);
          // 最终路由进行升序
          ascending(
            (router.options.routes[0]?.children ?? []) as unknown as Parameters<
              typeof ascending
            >[0]
          );
          if (v?.name && !router.hasRoute(v.name)) router.addRoute(v);
          const flattenRouters: RouteRecordNormalized | undefined = router
            .getRoutes()
            .find(n => n.path === "/");
          if (flattenRouters) router.addRoute(flattenRouters);
        }
      }
    );
    usePermissionStoreHook().handleWholeMenus(routeList);
  }
  if (!useMultiTagsStoreHook().getMultiTagsCache) {
    useMultiTagsStoreHook().handleTags("equal", [
      ...routerArrays,
      ...usePermissionStoreHook().flatteningRoutes.filter(
        v => v?.meta?.fixedTag
      )
    ]);
  }
  addPathMatch();
}

/**
 * 将多级嵌套路由处理成一维数组
 * @param routesList - 路由数组
 * @returns 扁平化后的路由数组
 * @remarks 递归展开所有子路由到同一层级
 */
export function formatFlatteningRoutes(routesList: RouteRecordRaw[]) {
  if (routesList.length === 0) return routesList;
  // buildHierarchyTree 接受 TreeNode[]，这里需要类型断言
  let hierarchyList = buildHierarchyTree(
    routesList as unknown as import("@/utils/tree").TreeNode[]
  ) as unknown as RouteRecordRaw[];
  for (let i = 0; i < hierarchyList.length; i++) {
    if (hierarchyList[i].children) {
      hierarchyList = hierarchyList
        .slice(0, i + 1)
        .concat(hierarchyList[i].children ?? [], hierarchyList.slice(i + 1));
    }
  }
  return hierarchyList;
}

/**
 * 一维数组处理成多级嵌套数组（三级及以上的路由全部拍成二级）
 * @param routesList - 扁平化的路由数组
 * @returns 二级结构的路由数组
 * @remarks 第一个路由必须是根路径 "/"，其他路由作为其 children
 */
export function formatTwoStageRoutes(routesList: RouteRecordRaw[]) {
  if (routesList.length === 0) return routesList;
  const newRoutesList: RouteRecordRaw[] = [];
  routesList.forEach((v: RouteRecordRaw) => {
    if (v.path === "/") {
      newRoutesList.push({
        component: v.component,
        name: v.name,
        path: v.path,
        redirect: v.redirect,
        meta: v.meta,
        children: []
      });
    } else {
      newRoutesList[0]?.children?.push({ ...v });
    }
  });
  return newRoutesList;
}

/**
 * 过滤后端传来的动态路由，重新生成规范路由
 * @param arrRoutes - 后端返回的路由数组
 * @returns 处理后的路由数组（修改原数组）
 * @remarks
 * - 添加 backstage 标识
 * - 自动处理 redirect 和 name
 * - 解析组件路径并加载对应模块
 */
export function addAsyncRoutes(arrRoutes: Array<RouteRecordRaw>) {
  if (!arrRoutes || !arrRoutes.length) return arrRoutes;
  arrRoutes.forEach((v: RouteRecordRaw) => {
    // 将backstage属性加入meta，标识此路由为后端返回路由
    if (v.meta) {
      v.meta.backstage = true;
    }
    if (v?.children && v.children.length && !v.redirect)
      v.redirect = v.children[0].path;
    if (v?.children && v.children.length && !v.name)
      v.name = (v.children[0].name as string) + "Parent";
    if (v.meta?.frameSrc) {
      v.component = IFrame;
    } else {
      const moduleKeyFromComponent = resolveViewsModuleKeyByComponent(
        v.component
      );
      const moduleKeyFromPath =
        v?.children && v.children.length
          ? null
          : resolveViewsModuleKeyByRoutePath(v.path);
      const resolvedModuleKey = moduleKeyFromComponent ?? moduleKeyFromPath;
      if (resolvedModuleKey) {
        v.component = modulesRoutes[resolvedModuleKey];
      } else if (isString(v.component)) {
        v.component = modulesRoutes["/src/views/error/404.vue"];
      }
    }
    if (v?.children && v.children.length) {
      addAsyncRoutes(v.children);
    }
  });
  return arrRoutes;
}

/**
 * 获取路由历史模式
 * @param routerHistory - 路由历史模式字符串，格式为 "mode" 或 "mode,base"
 * @returns Vue Router 历史模式实例
 * @example
 * ```ts
 * getHistoryMode('hash')        // createWebHashHistory('')
 * getHistoryMode('h5')          // createWebHistory('')
 * getHistoryMode('hash,/app')   // createWebHashHistory('/app')
 * getHistoryMode('h5,/app')     // createWebHistory('/app')
 * ```
 */
export function getHistoryMode(routerHistory: string): RouterHistory {
  const historyMode = routerHistory.split(",");
  const leftMode = historyMode[0];
  const rightMode = historyMode[1];
  if (historyMode.length === 1) {
    if (leftMode === "hash") {
      return createWebHashHistory("");
    } else if (leftMode === "h5") {
      return createWebHistory("");
    }
  } else if (historyMode.length === 2) {
    if (leftMode === "hash") {
      return createWebHashHistory(rightMode);
    } else if (leftMode === "h5") {
      return createWebHistory(rightMode);
    }
  }
  // 默认返回 hash 模式
  return createWebHashHistory("");
}
