import NProgress from "@/utils/progress";
import { message } from "@/utils/message";
import { buildHierarchyTree, type TreeNode } from "@/utils/tree";
import remainingRouter from "./modules/remaining";
import { routerLogger } from "@/utils/logger";
import { formatRuntimeError, showRuntimeError } from "@/utils/runtimeError";

import { usePermissionStoreHook } from "@/store/modules/permission";
import {
  ascending,
  getHistoryMode,
  formatTwoStageRoutes,
  formatFlatteningRoutes,
  getNavigationErrorMessage,
  isChunkLoadError,
  resolveSafeErrorRoute,
  safeNavigate
} from "./utils";
import { type Router, createRouter, type RouteRecordRaw } from "vue-router";
import type { ExtendedRouteRecord } from "./types";

/** 自动导入全部静态路由，无需再手动引入！匹配 src/router/modules 目录（任何嵌套级别）中具有 .ts 扩展名的所有文件，除了 remaining.ts 文件
 * 如何匹配所有文件请看：https://github.com/mrmlnc/fast-glob#basic-syntax
 * 如何排除文件请看：https://cn.vitejs.dev/guide/features.html#negative-patterns
 */
const modules: Record<string, { default: RouteRecordRaw }> = import.meta.glob(
  [
    "./modules/**/*.ts",
    "!./modules/**/*.test.ts",
    "!./modules/**/*.spec.ts",
    "!./modules/**/remaining.ts",
    "!./modules/**/auth.ts"
  ],
  {
    eager: true
  }
);

/** 原始静态路由（未做任何处理） */
const routes: ExtendedRouteRecord[] = [];

Object.keys(modules).forEach(key => {
  routes.push(modules[key].default as ExtendedRouteRecord);
});

function flattenStaticRoutes(
  routeList: ExtendedRouteRecord[]
): ExtendedRouteRecord[] {
  return routeList.flat(Infinity) as ExtendedRouteRecord[];
}

function asTreeNodes<T>(routeList: T[]): Array<T & TreeNode> {
  return routeList as Array<T & TreeNode>;
}

function buildStaticRouteTree(
  routeList: ExtendedRouteRecord[]
): ExtendedRouteRecord[] {
  return buildHierarchyTree(
    asTreeNodes(ascending(routeList))
  ) as ExtendedRouteRecord[];
}

/** 导出处理后的静态路由（三级及以上的路由全部拍成二级） */
export const constantRoutes: Array<RouteRecordRaw> = formatTwoStageRoutes(
  formatFlatteningRoutes(buildStaticRouteTree(flattenStaticRoutes(routes)))
);

/** 用于渲染菜单，保持原始层级 */

export const constantMenus: Array<RouteRecordRaw> = ascending(
  flattenStaticRoutes(routes)
)
  .map(route => route as RouteRecordRaw)
  .concat(remainingRouter as RouteRecordRaw[]);

/** 不参与菜单的路由 */
export const remainingPaths = (remainingRouter as RouteRecordRaw[]).map(
  route => route.path
);

/** 记录已经加载的页面路径 */
const loadedPaths = new Set<string>();

/** 重置已加载页面记录 */
export function resetLoadedPaths() {
  loadedPaths.clear();
}

/** 创建路由实例 */
export const router: Router = createRouter({
  history: getHistoryMode(import.meta.env.VITE_ROUTER_HISTORY),
  routes: constantRoutes.concat(...(remainingRouter as RouteRecordRaw[])),
  strict: true,
  scrollBehavior(to, from, savedPosition) {
    return new Promise(resolve => {
      if (savedPosition) {
        resolve(savedPosition);
      } else if (from.meta.saveScrollTop) {
        const top: number =
          document.documentElement.scrollTop || document.body.scrollTop;
        resolve({ left: 0, top });
      } else {
        resolve({ left: 0, top: 0 });
      }
    });
  }
});

/** 重置路由 */
export function resetRouter() {
  router.getRoutes().forEach(route => {
    const { name, meta } = route;
    if (name && router.hasRoute(name) && meta?.backstage) {
      router.removeRoute(name);
      router.options.routes = formatTwoStageRoutes(
        formatFlatteningRoutes(
          buildStaticRouteTree(flattenStaticRoutes(routes))
        )
      );
    }
  });
  usePermissionStoreHook().clearAllCachePage();
  resetLoadedPaths();
}

import {
  handleKeepAliveCache,
  handleDocumentTitle,
  handleExternalLink,
  handleRouterInit,
  handlePermissionCheck,
  handleSessionValidation,
  toCorrectRoute,
  isAuthenticated,
  handleUnauthenticated
} from "./utils/routerGuard";

router.beforeEach(async (to: ToRouteType, _from, next) => {
  to.meta.loaded = loadedPaths.has(to.path);
  if (!to.meta.loaded) {
    NProgress.start();
  }

  // 处理 keepAlive 缓存
  handleKeepAliveCache(to, _from);

  // 处理页面标题
  const externalLink = handleDocumentTitle(to);

  // 检查认证状态
  const { authenticated, userInfo } = isAuthenticated();

  if (authenticated) {
    if (await handleSessionValidation(next)) return;

    // 已登录：处理路由初始化
    const handled = await handleRouterInit(to, next, externalLink);
    if (handled) return;

    // 权限检查
    if (handlePermissionCheck(to, userInfo, next)) return;

    // 处理外部链接
    if (_from?.name && handleExternalLink(to, next)) return;

    // 正常路由跳转
    toCorrectRoute(to, _from, next);
  } else {
    // 未登录：处理未认证路由
    handleUnauthenticated(to, next);
  }
});

router.afterEach(to => {
  loadedPaths.add(to.path);
  NProgress.done();
});

router.onError(async error => {
  NProgress.done();

  const errorDetail = formatRuntimeError(
    error,
    router.currentRoute.value.fullPath
  );
  routerLogger.error("[Router] unhandled navigation error", errorDetail);

  if (!isChunkLoadError(error)) {
    message(getNavigationErrorMessage(error), { type: "error" });
  }

  const fallback = resolveSafeErrorRoute(router);
  const currentPath = router.currentRoute.value.path;
  const fallbackPath = router.resolve(fallback).path;

  if (currentPath !== fallbackPath) {
    const navigated = await safeNavigate(router, fallback, {
      replace: true,
      fallback: { path: "/login" },
      silent: true
    });
    if (navigated) return;
  }

  showRuntimeError({
    kind: "router",
    title: "页面跳转异常",
    message: getNavigationErrorMessage(error),
    detail: errorDetail
  });
});

export default router;
