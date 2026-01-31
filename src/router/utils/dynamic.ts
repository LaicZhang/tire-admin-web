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
import { routerLogger } from "@/utils/logger";
import { routerArrays } from "@/layout/types";
import { toMultiTypeArray } from "@/store/utils";
import { buildHierarchyTree } from "@/utils/tree";
import { useMultiTagsStoreHook } from "@/store/modules/multiTags";
import { usePermissionStoreHook } from "@/store/modules/permission";
import { ascending } from "./filter";
// 导入静态路由配置，用于组件映射
import staticRoutes from "../modules/auth";
import type { ExtendedRouteRecord } from "../types";

const IFrame = () => import("@/layout/frameView.vue");

// https://cn.vitejs.dev/guide/features.html#glob-import
const modulesRoutes = import.meta.glob("/src/views/**/*.{vue,tsx}");
const modulesRoutesKeys = Object.keys(modulesRoutes);

/**
 * 构建静态路由组件映射表
 * 将静态路由的 path -> component 映射缓存起来
 */
type StaticRouteItem = {
  path: string;
  name?: string;
  component?: RouteRecordRaw["component"];
  children?: StaticRouteItem[];
} & Partial<ExtendedRouteRecord>;

function buildStaticComponentMap(
  routes: StaticRouteItem[],
  map: Map<string, RouteRecordRaw["component"]> = new Map()
): Map<string, RouteRecordRaw["component"]> {
  routes.forEach(route => {
    if (route.component) {
      map.set(route.path, route.component);
    }
    if (route.children && route.children.length > 0) {
      buildStaticComponentMap(route.children, map);
    }
  });
  return map;
}

// 构建静态组件映射表
const staticComponentMap = buildStaticComponentMap(
  staticRoutes as unknown as StaticRouteItem[]
);

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
  // 路由路径如 /system/updateHistory 需要映射到 /src/views/system/updateHistory/index.vue
  const viewsPath = `/views${routePath}`;
  const candidates = [
    `${viewsPath}/index.`,
    `${viewsPath}.`,
    viewsPath,
    // 保留原始路径作为回退
    `${routePath}/index.`,
    `${routePath}.`,
    routePath
  ];
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
    const fixedRoutes = usePermissionStoreHook()
      .flatteningRoutes.filter(v => v?.meta?.fixedTag)
      .map(v => ({
        path: v.path,
        name: typeof v.name === "string" ? v.name : undefined,
        meta: v.meta,
        query: undefined,
        params: undefined
      }));
    useMultiTagsStoreHook().handleTags(
      "equal",
      toMultiTypeArray([...routerArrays, ...fixedRoutes])
    );
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
  const rootRoute = routesList.find(v => v.path === "/");
  if (!rootRoute) return routesList;

  const children: RouteRecordRaw[] = [];
  routesList.forEach((v: RouteRecordRaw) => {
    if (v.path !== "/") children.push({ ...v });
  });

  return [
    {
      component: rootRoute.component,
      name: rootRoute.name,
      path: rootRoute.path,
      redirect: rootRoute.redirect,
      meta: rootRoute.meta,
      children
    }
  ];
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
      // 1. 优先从静态路由映射表中查找组件
      const staticComponent = staticComponentMap.get(v.path);
      if (staticComponent) {
        v.component = staticComponent;
      } else {
        // 2. 尝试根据后端返回的 component 字符串解析
        const moduleKeyFromComponent = resolveViewsModuleKeyByComponent(
          v.component
        );
        // 3. 根据路径自动查找对应的 views 文件
        const moduleKeyFromPath =
          v?.children && v.children.length
            ? null
            : resolveViewsModuleKeyByRoutePath(v.path);
        const resolvedModuleKey = moduleKeyFromComponent ?? moduleKeyFromPath;
        if (resolvedModuleKey) {
          v.component = modulesRoutes[resolvedModuleKey];
        } else if (!v?.children || v.children.length === 0) {
          // 没有找到对应组件且没有子路由时，使用404页面作为兜底
          routerLogger.warn(
            `[Route] No component found for path: ${v.path}, falling back to 404`
          );
          v.component = modulesRoutes["/src/views/error/404.vue"];
        }
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
