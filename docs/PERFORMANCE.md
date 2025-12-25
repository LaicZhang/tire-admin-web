# 性能优化指南

本文档记录项目中的性能优化策略和最佳实践。

## 1. 组件缓存 (Keep-Alive)

项目已配置 `keep-alive` 缓存路由组件：

```vue
<!-- src/layout/components/appMain.vue -->
<keep-alive :include="keepAliveList">
  <component :is="Component" :key="route.fullPath" />
</keep-alive>
```

### 启用缓存

在路由 meta 中设置 `keepAlive: true`：

```typescript
{
  path: "/list",
  meta: { title: "列表", keepAlive: true }
}
```

## 2. 异步组件加载

对于大型组件，使用异步加载：

```typescript
import { defineAsyncComponent } from "vue";

// 带加载状态的异步组件
const AsyncForm = defineAsyncComponent({
  loader: () => import("./HeavyForm.vue"),
  loadingComponent: LoadingSpinner,
  delay: 200,
  timeout: 10000
});
```

## 3. 路由懒加载

所有路由组件默认使用懒加载：

```typescript
// 自动懒加载
{
  component: () => import("@/views/business/order/index.vue");
}
```

## 4. 图片优化

- 使用 WebP 格式
- 配置 `loading="lazy"` 延迟加载
- 使用适当尺寸的图片

```html
<img src="image.webp" loading="lazy" width="200" height="150" />
```

## 5. API 请求优化

### 防抖搜索

```typescript
import { useDebounceFn } from "@vueuse/core";

const debouncedSearch = useDebounceFn(search, 300);
```

### 请求缓存

对于不常变化的数据，使用本地缓存：

```typescript
// 使用 localforage 缓存
const cached = await localforage.getItem("key");
if (cached && !isExpired(cached)) return cached;

const data = await fetchApi();
await localforage.setItem("key", { data, timestamp: Date.now() });
```

## 6. 构建优化

已配置的优化项：

- ✅ Vite 代码分割
- ✅ ES2020 构建目标
- ✅ Element Plus 按需导入
- ✅ 图标按需加载 (unplugin-icons)

## 7. 运行时检查清单

| 检查项       | 工具                     |
| ------------ | ------------------------ |
| 首屏加载时间 | Lighthouse               |
| 包大小分析   | `pnpm build:analyze`     |
| 内存泄漏     | Chrome DevTools Memory   |
| 渲染性能     | Vue DevTools Performance |
