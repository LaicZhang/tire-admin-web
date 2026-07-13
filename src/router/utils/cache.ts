/**
 * 路由缓存相关工具函数
 */
import { cloneDeep, storageLocal } from "@pureadmin/utils";
import { useTimeoutFn } from "@vueuse/core";
import type { RouteRecordRaw } from "vue-router";
import { getConfig } from "@/config";
import type { CurrentCompanyInfo } from "@/utils/auth";
import { userKey, type DataInfo } from "@/utils/auth";
import { currentCompanyKey } from "@/store/modules/company";
import { router } from "../index";
import { usePermissionStoreHook } from "@/store/modules/permission";
import { useUserStoreHook } from "@/store/modules/user";
import { handleAsyncRoutes } from "./dynamic";
import { getAsyncRoutes } from "@/api/routes";
import { collectServerPermissionSummary } from "./permissionSummary";

/** 缓存刷新延迟时间（毫秒） */
const CACHE_REFRESH_DELAY_MS = 100;

/** 路由缓存数据结构 */
interface RouteCacheData {
  routes: RouteRecordRaw[];
  timestamp: number;
}

function getAsyncRouteCacheKey() {
  const userInfo = storageLocal().getItem<DataInfo<number>>(userKey);
  const companyInfo =
    storageLocal().getItem<CurrentCompanyInfo>(currentCompanyKey);
  const uid = userInfo?.uid || "anonymous";
  const companyId = companyInfo?.companyId || "no-company";
  const roles = Array.isArray(userInfo?.roles)
    ? userInfo.roles.slice().sort().join(",")
    : "no-roles";
  return `async-routes:${uid}:${companyId}:${roles}`;
}

/**
 * 初始化路由
 */
export async function initRouter() {
  const { data } = await getAsyncRoutes();
  const serverRoutes = Array.isArray(data) ? data : [];
  const summary = collectServerPermissionSummary(serverRoutes);
  const userStore = useUserStoreHook();
  userStore.setRoles(summary.roles);
  userStore.setPerms(summary.permissions);
  const cachedUserInfo = storageLocal().getItem<DataInfo<number>>(userKey);
  if (cachedUserInfo) {
    storageLocal().setItem(userKey, {
      ...cachedUserInfo,
      roles: summary.roles,
      permissions: summary.permissions
    });
  }

  if (getConfig()?.CachingAsyncRoutes) {
    // 开启动态路由缓存本地localStorage
    const key = getAsyncRouteCacheKey();
    handleAsyncRoutes(cloneDeep(serverRoutes) as RouteRecordRaw[]);
    storageLocal().setItem(key, {
      routes: serverRoutes,
      timestamp: Date.now()
    } as RouteCacheData);
    return router;
  }

  handleAsyncRoutes(cloneDeep(serverRoutes) as RouteRecordRaw[]);
  return router;
}

/**
 * 处理缓存路由（添加、删除、刷新）
 */
export function handleAliveRoute({ name }: ToRouteType, mode?: string) {
  const routeName = typeof name === "string" ? name : undefined;
  switch (mode) {
    case "add":
      usePermissionStoreHook().cacheOperate({
        mode: "add",
        name: routeName
      });
      break;
    case "delete":
      usePermissionStoreHook().cacheOperate({
        mode: "delete",
        name: routeName
      });
      break;
    case "refresh":
      usePermissionStoreHook().cacheOperate({
        mode: "refresh",
        name: routeName
      });
      break;
    default:
      usePermissionStoreHook().cacheOperate({
        mode: "delete",
        name: routeName
      });
      useTimeoutFn(() => {
        usePermissionStoreHook().cacheOperate({
          mode: "add",
          name: routeName
        });
      }, CACHE_REFRESH_DELAY_MS);
  }
}
