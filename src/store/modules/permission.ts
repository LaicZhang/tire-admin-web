import {
  type cacheType,
  store,
  debounce,
  ascending,
  getKeyList,
  filterTree,
  defineStore,
  constantMenus,
  filterNoPermissionTree,
  formatFlatteningRoutes
} from "../utils";
import { useMultiTagsStoreHook } from "./multiTags";
import type { RouteRecordRaw } from "vue-router";

export const usePermissionStore = defineStore("pure-permission", {
  state: (): {
    constantMenus: RouteRecordRaw[];
    wholeMenus: RouteRecordRaw[];
    flatteningRoutes: RouteRecordRaw[];
    cachePageList: string[];
  } => ({
    // 静态路由生成的菜单
    constantMenus: constantMenus as unknown as RouteRecordRaw[],
    // 整体路由生成的菜单（静态、动态）
    wholeMenus: [],
    // 整体路由（一维数组格式）
    flatteningRoutes: [],
    // 缓存页面keepAlive
    cachePageList: []
  }),
  actions: {
    /** 组装整体路由生成的菜单 */
    handleWholeMenus(routes: RouteRecordRaw[]) {
      const merged = (this.constantMenus as unknown[]).concat(
        routes as unknown[]
      );
      this.wholeMenus = filterNoPermissionTree(
        filterTree(ascending(merged as RouteRecordRaw[]))
      ) as unknown as RouteRecordRaw[];
      this.flatteningRoutes = formatFlatteningRoutes(
        merged as unknown as RouteRecordRaw[]
      ) as unknown as RouteRecordRaw[];
    },
    cacheOperate({ mode, name }: cacheType) {
      if (!name) return;
      const delIndex = this.cachePageList.findIndex(v => v === name);
      switch (mode) {
        case "refresh":
          this.cachePageList = this.cachePageList.filter(v => v !== name);
          break;
        case "add":
          this.cachePageList.push(name);
          break;
        case "delete":
          delIndex !== -1 && this.cachePageList.splice(delIndex, 1);
          break;
      }
      /** 监听缓存页面是否存在于标签页，不存在则删除 */
      debounce(() => {
        let cacheLength = this.cachePageList.length;
        const nameList = getKeyList(useMultiTagsStoreHook().multiTags, "name");
        while (cacheLength > 0) {
          nameList.findIndex(v => v === this.cachePageList[cacheLength - 1]) ===
            -1 &&
            this.cachePageList.splice(
              this.cachePageList.indexOf(this.cachePageList[cacheLength - 1]),
              1
            );
          cacheLength--;
        }
      })();
    },
    /** 清空缓存页面 */
    clearAllCachePage() {
      this.wholeMenus = [];
      this.cachePageList = [];
    }
  }
});

export function usePermissionStoreHook() {
  return usePermissionStore(store);
}
