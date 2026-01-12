import NProgress from "@/utils/progress";
import { buildHierarchyTree } from "@/utils/tree";
import remainingRouter from "./modules/remaining";

import { usePermissionStoreHook } from "@/store/modules/permission";
import {
  ascending,
  getHistoryMode,
  formatTwoStageRoutes,
  formatFlatteningRoutes
} from "./utils";
import {
  type Router,
  createRouter,
  type RouteRecordRaw,
  type RouteComponent
} from "vue-router";
import type { ExtendedRouteRecord } from "./types";
import { removeToken } from "@/utils/auth";

/** 自动导入全部静态路由，无需再手动引入！匹配 src/router/modules 目录（任何嵌套级别）中具有 .ts 扩展名的所有文件，除了 remaining.ts 文件
 * 如何匹配所有文件请看：https://github.com/mrmlnc/fast-glob#basic-syntax
 * 如何排除文件请看：https://cn.vitejs.dev/guide/features.html#negative-patterns
 */
const modules: Record<string, { default: RouteRecordRaw }> = import.meta.glob(
  ["./modules/**/*.ts", "!./modules/**/remaining.ts", "!./modules/**/auth.ts"],
  {
    eager: true
  }
);

/** 原始静态路由（未做任何处理） */
const routes: ExtendedRouteRecord[] = [];

Object.keys(modules).forEach(key => {
  routes.push(modules[key].default as ExtendedRouteRecord);
});

/** 导出处理后的静态路由（三级及以上的路由全部拍成二级） */
export const constantRoutes: Array<RouteRecordRaw> = formatTwoStageRoutes(
  formatFlatteningRoutes(
    buildHierarchyTree(
      ascending(
        // flat(Infinity) returns unknown[], need type assertion for ascending()
        routes.flat(Infinity) as ExtendedRouteRecord[]
      ) as unknown as import("@/utils/tree").TreeNode[]
    ) as unknown as ExtendedRouteRecord[]
  )
);

/** 用于渲染菜单，保持原始层级 */

export const constantMenus: Array<RouteComponent> = (
  ascending(
    routes.flat(Infinity) as ExtendedRouteRecord[]
  ) as unknown as RouteComponent[]
).concat(remainingRouter as unknown as RouteComponent[]);

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
          buildHierarchyTree(
            ascending(
              // flat(Infinity) returns unknown[], need type assertion
              routes.flat(Infinity) as ExtendedRouteRecord[]
            ) as unknown as import("@/utils/tree").TreeNode[]
          ) as unknown as RouteRecordRaw[]
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
    // 已登录：处理路由初始化
    const handled = await handleRouterInit(to, next, externalLink);
    if (handled) return;

    // 权限检查
    if (handlePermissionCheck(to, userInfo, next)) return;

    // 处理外部链接
    if (_from?.name && handleExternalLink(to, next)) return;

    // 刷新情况下的路由初始化
    if (!_from?.name) {
      if (
        usePermissionStoreHook().wholeMenus.length === 0 &&
        to.path !== "/login"
      ) {
        import("./utils/cache").then(({ initRouter }) => {
          initRouter()
            .then(() => {
              next({ ...to, replace: true });
            })
            .catch(error => {
              console.error("[Router] initRouter failed:", error);
              removeToken();
              next({ path: "/login", replace: true });
            });
        });
        return;
      }
    }

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

export default router;
