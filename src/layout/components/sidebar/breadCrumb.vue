<script setup lang="ts">
import { isEqual } from "@pureadmin/utils";
import { useRoute, useRouter } from "vue-router";
import { ref, watch, onMounted, toRaw } from "vue";
import { getParentPaths, findRouteByPath } from "@/router/utils";
import { useMultiTagsStoreHook } from "@/store/modules/multiTags";
import type { RouteConfigs } from "@/layout/types";

const route = useRoute();
type BreadcrumbRoute = RouteConfigs & {
  meta: NonNullable<RouteConfigs["meta"]>;
};
const levelList = ref<BreadcrumbRoute[]>([]);
const router = useRouter();
const routes = router.options.routes;
const multiTags = useMultiTagsStoreHook().multiTags;

const getBreadcrumb = (): void => {
  // 当前路由信息
  let currentRoute: RouteConfigs | undefined;

  if (Object.keys(route.query).length > 0) {
    multiTags.forEach(item => {
      if (isEqual(route.query, item?.query)) {
        currentRoute = toRaw(item);
      }
    });
  } else if (Object.keys(route.params).length > 0) {
    multiTags.forEach(item => {
      if (isEqual(route.params, item?.params)) {
        currentRoute = toRaw(item);
      }
    });
  } else {
    const found = findRouteByPath(router.currentRoute.value.path, routes);
    currentRoute = found ? (found as unknown as RouteConfigs) : undefined;
  }

  // 当前路由的父级路径组成的数组
  const parentRoutes = getParentPaths(
    router.currentRoute.value.name as string,
    routes,
    "name"
  );
  // 存放组成面包屑的数组
  const matched: (RouteConfigs | undefined)[] = [];

  // 获取每个父级路径对应的路由信息
  parentRoutes.forEach(path => {
    if (path === "/") return;
    const found = findRouteByPath(path, routes);
    if (found) matched.push(found as unknown as RouteConfigs);
  });

  matched.push(currentRoute);

  matched.forEach((item, index) => {
    if (currentRoute?.query || currentRoute?.params) return;
    if (item?.children) {
      item.children.forEach((v: RouteConfigs) => {
        if (v?.meta?.title === item?.meta?.title) {
          matched.splice(index, 1);
        }
      });
    }
  });

  levelList.value = matched.filter(
    (item): item is BreadcrumbRoute =>
      item !== undefined &&
      item?.meta !== undefined &&
      Boolean(item?.meta?.title)
  );
};

const handleLink = (item: RouteConfigs) => {
  const { redirect, name, path } = item;
  if (redirect) {
    router.push(redirect);
  } else {
    if (name) {
      if (item.query) {
        router.push({
          name,
          query: item.query
        });
      } else if (item.params) {
        router.push({
          name,
          params: item.params
        });
      } else {
        router.push({ name });
      }
    } else {
      path && router.push({ path });
    }
  }
};
// const handleLink = item => {
//   const { redirect, name, path, query, params } = item;
//   if (redirect) {
//     router.push(redirect as unknown);
//   } else {
//     const routeOptions = name
//       ? { name, params: params || {}, query: query || {} }
//       : { path };
//     router.push(routeOptions);
//   }
// };

onMounted(() => {
  getBreadcrumb();
});

watch(
  () => route.path,
  () => {
    getBreadcrumb();
  },
  {
    deep: true
  }
);
</script>

<template>
  <el-breadcrumb class="!leading-[50px] select-none" separator="/">
    <transition-group name="breadcrumb">
      <el-breadcrumb-item
        v-for="item in levelList"
        :key="item.path"
        class="!inline !items-stretch"
      >
        <a @click.prevent="handleLink(item)">
          {{ item.meta.title }}
        </a>
      </el-breadcrumb-item>
    </transition-group>
  </el-breadcrumb>
</template>
