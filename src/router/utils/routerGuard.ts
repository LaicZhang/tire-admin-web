/**
 * 路由守卫模块
 * 从 index.ts 中抽取的路由守卫辅助函数
 */
import Cookies from "js-cookie";
import { getConfig } from "@/config";
import NProgress from "@/utils/progress";
import { usePermissionStoreHook } from "@/store/modules/permission";
import { isUrl, openLink, storageLocal } from "@pureadmin/utils";
import { isOneOfArray, handleAliveRoute } from "./index";
import {
  type DataInfo,
  userKey,
  removeToken,
  multipleTabsKey
} from "@/utils/auth";

/** 路由白名单 */
const whiteList = ["/login"];
const { VITE_HIDE_HOME } = import.meta.env;

/** 动态路由初始化中的单例 Promise，避免并发重复初始化 */
let initRouterPromise: Promise<unknown> | null = null;

/**
 * 处理 keepAlive 缓存
 */
export function handleKeepAliveCache(to: ToRouteType, from: ToRouteType) {
  if (to.meta?.keepAlive) {
    handleAliveRoute(to, "add");
    // 页面整体刷新和点击标签页刷新
    if (from.name === undefined || from.name === "Redirect") {
      handleAliveRoute(to);
    }
  }
}

/**
 * 处理页面标题
 */
export function handleDocumentTitle(to: ToRouteType) {
  const externalLink = isUrl(to?.name as string);
  if (!externalLink) {
    to.matched.some(item => {
      if (!item.meta.title) return "";
      const Title = getConfig().Title;
      if (Title) document.title = `${item.meta.title} | ${Title}`;
      else document.title = item.meta.title as string;
    });
  }
  return externalLink;
}

/**
 * 处理外部链接
 */
export function handleExternalLink(
  to: ToRouteType,
  next: (to?: unknown) => void
): boolean {
  const externalLink = isUrl(to?.name as string);
  if (externalLink) {
    openLink(to?.name as string);
    NProgress.done();
    next(false);
    return true;
  }
  return false;
}

/**
 * 处理认证和路由初始化
 */
export async function handleRouterInit(
  to: ToRouteType,
  next: (to?: unknown) => void,
  externalLink: boolean
): Promise<boolean> {
  if (
    !externalLink &&
    to.path !== "/login" &&
    (usePermissionStoreHook().wholeMenus.length === 0 ||
      to.matched.length === 0)
  ) {
    if (!initRouterPromise) {
      initRouterPromise = import("./cache")
        .then(({ initRouter }) => initRouter())
        .finally(() => {
          initRouterPromise = null;
        });
    }
    try {
      await initRouterPromise;
      next({ ...to, replace: true });
    } catch (error) {
      console.error("[Router] initRouter failed:", error);
      removeToken();
      next({ path: "/login", replace: true });
    }
    return true; // 表示已处理
  }
  return false;
}

/**
 * 处理权限检查
 */
export function handlePermissionCheck(
  to: ToRouteType,
  userInfo: DataInfo<number> | null,
  next: (to?: unknown) => void
): boolean {
  // 无权限跳转403页面
  if (to.meta?.roles && !isOneOfArray(to.meta.roles, userInfo?.roles ?? [])) {
    next({ path: "/error/403" });
    return true;
  }
  // 开启隐藏首页后在浏览器地址栏手动输入首页welcome路由则跳转到404页面
  if (VITE_HIDE_HOME === "true" && to.fullPath === "/welcome") {
    next({ path: "/error/404" });
    return true;
  }
  return false;
}

/**
 * 处理白名单路由跳转
 */
export function toCorrectRoute(
  to: ToRouteType,
  from: ToRouteType,
  next: (to?: unknown) => void
) {
  whiteList.includes(to.path) ? next(from.fullPath) : next();
}

/**
 * 检查是否已登录
 */
export function isAuthenticated(): {
  authenticated: boolean;
  userInfo: DataInfo<number> | null;
} {
  const userInfo = storageLocal().getItem<DataInfo<number>>(userKey);
  const authenticated = !!(Cookies.get(multipleTabsKey) && userInfo);
  return { authenticated, userInfo };
}

/**
 * 处理未认证路由
 */
export function handleUnauthenticated(
  to: ToRouteType,
  next: (to?: unknown) => void
) {
  if (to.path !== "/login") {
    if (whiteList.indexOf(to.path) !== -1) {
      next();
    } else {
      removeToken();
      next({ path: "/login" });
    }
  } else {
    next();
  }
}
