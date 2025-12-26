/**
 * 路由缓存相关工具函数
 */
import { cloneDeep, storageLocal } from "@pureadmin/utils";
import { useTimeoutFn } from "@vueuse/core";
import type { RouteRecordRaw } from "vue-router";
import { getConfig } from "@/config";
import { router } from "../index";
import { usePermissionStoreHook } from "@/store/modules/permission";
import { handleAsyncRoutes } from "./dynamic";
import { getAsyncRoutes } from "@/api/routes";

/** 路由缓存过期时间（毫秒）：1小时 */
const ROUTE_CACHE_EXPIRY_MS = 60 * 60 * 1000;

/** 缓存刷新延迟时间（毫秒） */
const CACHE_REFRESH_DELAY_MS = 100;

/** 路由缓存数据结构 */
interface RouteCacheData {
  routes: RouteRecordRaw[];
  timestamp: number;
}

/**
 * 检查路由缓存是否过期
 */
function isRouteCacheExpired(cacheData: RouteCacheData | null): boolean {
  if (!cacheData || !cacheData.timestamp) return true;
  return Date.now() - cacheData.timestamp > ROUTE_CACHE_EXPIRY_MS;
}

/**
 * 初始化路由（`new Promise` 写法防止在异步请求中造成无限循环）
 */
export function initRouter() {
  if (getConfig()?.CachingAsyncRoutes) {
    // 开启动态路由缓存本地localStorage
    const key = "async-routes";
    const cachedData = storageLocal().getItem(key) as RouteCacheData | null;

    // 检查缓存是否存在且未过期
    if (
      cachedData &&
      cachedData.routes &&
      cachedData.routes.length > 0 &&
      !isRouteCacheExpired(cachedData)
    ) {
      return new Promise(resolve => {
        handleAsyncRoutes(cachedData.routes);
        resolve(router);
      });
    } else {
      // 缓存不存在或已过期，从后端获取
      return new Promise(resolve => {
        getAsyncRoutes().then(({ data }) => {
          handleAsyncRoutes(cloneDeep(data));
          // 存储路由和时间戳
          storageLocal().setItem(key, {
            routes: data,
            timestamp: Date.now()
          } as RouteCacheData);
          resolve(router);
        });
      });
    }
  } else {
    return new Promise(resolve => {
      getAsyncRoutes().then(({ data }) => {
        handleAsyncRoutes(cloneDeep(data));
        resolve(router);
      });
    });
  }
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
