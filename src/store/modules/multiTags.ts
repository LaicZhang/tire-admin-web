import { defineStore } from "pinia";
import {
  type multiType,
  type positionType,
  store,
  isUrl,
  isEqual,
  isNumber,
  isBoolean,
  getConfig,
  routerArrays,
  storageLocal,
  responsiveStorageNameSpace
} from "../utils";
import { usePermissionStoreHook } from "./permission";

/**
 * 类型守卫：检查路由是否有 fixedTag 属性
 */
function hasFixedTag(
  route: unknown
): route is { meta?: { fixedTag?: boolean } } {
  return (
    typeof route === "object" &&
    route !== null &&
    "meta" in route &&
    typeof (route as { meta?: unknown }).meta === "object"
  );
}

export const useMultiTagsStore = defineStore("pure-multiTags", {
  state: (): {
    multiTags: multiType[];
    multiTagsCache: boolean;
  } => ({
    // 存储标签页信息（路由信息）
    multiTags: (() => {
      const cacheEnabled =
        storageLocal().getItem<StorageConfigs>(
          `${responsiveStorageNameSpace()}configure`
        )?.multiTagsCache ?? false;
      if (cacheEnabled) {
        const cached = storageLocal().getItem(
          `${responsiveStorageNameSpace()}tags`
        ) as unknown as multiType[] | null;
        if (cached && Array.isArray(cached)) return cached;
      }
      return [
        ...routerArrays
          .filter(
            (r): r is RouteConfigs & { path: string; name: string } =>
              r.path !== undefined && r.name !== undefined
          )
          .map(r => ({
            path: r.path,
            name: r.name,
            meta: r.meta || {},
            query: r.query as multiType["query"],
            params: r.params as multiType["params"]
          })),
        ...usePermissionStoreHook()
          .flatteningRoutes.filter(v => hasFixedTag(v) && v.meta?.fixedTag)
          .map(v => {
            const route = v as {
              path?: string;
              name?: string;
              meta?: unknown;
              query?: unknown;
              params?: unknown;
            };
            if (!route.path || !route.name) return null;
            return {
              path: route.path,
              name: route.name,
              meta: (route.meta as multiType["meta"]) || {},
              query: route.query as multiType["query"],
              params: route.params as multiType["params"]
            };
          })
          .filter((v): v is multiType => v !== null)
      ];
    })(),
    multiTagsCache:
      storageLocal().getItem<StorageConfigs>(
        `${responsiveStorageNameSpace()}configure`
      )?.multiTagsCache ?? false
  }),
  getters: {
    getMultiTagsCache(state): boolean {
      return state.multiTagsCache;
    }
  },
  actions: {
    multiTagsCacheChange(multiTagsCache: boolean) {
      this.multiTagsCache = multiTagsCache;
      if (multiTagsCache) {
        storageLocal().setItem(
          `${responsiveStorageNameSpace()}tags`,
          this.multiTags
        );
      } else {
        storageLocal().removeItem(`${responsiveStorageNameSpace()}tags`);
      }
    },
    tagsCache(multiTags: multiType[]) {
      this.getMultiTagsCache &&
        storageLocal().setItem(
          `${responsiveStorageNameSpace()}tags`,
          multiTags
        );
    },
    handleTags(
      mode: string,
      value?: multiType | multiType[] | string,
      position?: positionType
    ): multiType[] | undefined {
      switch (mode) {
        case "equal":
          this.multiTags = (Array.isArray(value) ? value : []) as multiType[];
          this.tagsCache(this.multiTags);
          break;
        case "push":
          {
            const tagVal = value as multiType;
            // 不添加到标签页
            if (tagVal?.meta?.hiddenTag) return;
            // 如果是外链无需添加信息到标签页
            if (isUrl(tagVal?.name)) return;
            // 如果title为空拒绝添加空信息到标签页
            if (!tagVal?.meta?.title || tagVal.meta.title.length === 0) return;
            // showLink:false 不添加到标签页
            if (isBoolean(tagVal?.meta?.showLink) && !tagVal?.meta?.showLink)
              return;
            const tagPath = tagVal.path;
            // 判断tag是否已存在
            const tagHasExits = this.multiTags.some(tag => {
              return tag.path === tagPath;
            });

            // 判断tag中的query键值是否相等
            const tagQueryHasExits = this.multiTags.some(tag => {
              return isEqual(tag?.query, tagVal?.query);
            });

            // 判断tag中的params键值是否相等
            const tagParamsHasExits = this.multiTags.some(tag => {
              return isEqual(tag?.params, tagVal?.params);
            });

            if (tagHasExits && tagQueryHasExits && tagParamsHasExits) return;

            // 动态路由可打开的最大数量
            const dynamicLevel = tagVal?.meta?.dynamicLevel ?? -1;
            if (dynamicLevel > 0) {
              if (
                this.multiTags.filter(e => e?.path === tagPath).length >=
                dynamicLevel
              ) {
                // 如果当前已打开的动态路由数大于dynamicLevel，替换第一个动态路由标签
                const index = this.multiTags.findIndex(
                  item => item?.path === tagPath
                );
                index !== -1 && this.multiTags.splice(index, 1);
              }
            }
            this.multiTags.push(tagVal);
            this.tagsCache(this.multiTags);
            const maxTagsLevel = getConfig()?.MaxTagsLevel;
            if (
              isNumber(maxTagsLevel) &&
              this.multiTags.length > maxTagsLevel
            ) {
              this.multiTags.splice(1, 1);
            }
          }
          break;
        case "splice":
          if (!position) {
            if (typeof value !== "string") return undefined;
            const index = this.multiTags.findIndex(v => v.path === value);
            if (index === -1) return undefined;
            this.multiTags.splice(index, 1);
          } else {
            this.multiTags.splice(
              position.startIndex ?? 0,
              position.length ?? 1
            );
          }
          this.tagsCache(this.multiTags);
          return this.multiTags;
        case "slice":
          return this.multiTags.slice(-1);
      }
      return undefined;
    }
  }
});

export function useMultiTagsStoreHook() {
  return useMultiTagsStore(store);
}
