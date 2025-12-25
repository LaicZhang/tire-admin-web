# ReIcon 组件

图标渲染组件，支持多种图标库和动态加载。

## 使用方法

### 在模板中使用

```vue
<template>
  <IconifyIconOffline :icon="HomeFilled" />
  <IconifyIconOnline icon="ep:edit" />
</template>

<script setup>
import HomeFilled from "~icons/ep/home-filled";
</script>
```

### 在 JS 中使用（表格列等）

```typescript
import { useRenderIcon } from "@/components/ReIcon/src/hooks";
import Edit from "~icons/ep/edit";

const columns = [
  {
    label: "操作",
    cellRenderer: () => h(ElButton, { icon: useRenderIcon(Edit) }, "编辑")
  }
];
```

## 组件说明

### IconifyIconOffline

离线图标组件，使用预打包的图标资源。

**优点**：

- 无需网络请求
- 加载速度快
- 支持 Tree-shaking

**使用场景**：常用图标、性能敏感场景

### IconifyIconOnline

在线图标组件，从 CDN 加载图标。

**优点**：

- 图标库丰富
- 按需加载

**使用场景**：不常用图标、需要动态切换图标

## 图标来源

使用 [unplugin-icons](https://github.com/unplugin/unplugin-icons) 自动导入图标：

```typescript
// Element Plus 图标
import HomeFilled from "~icons/ep/home-filled";

// Remix Icon
import AddCircleLine from "~icons/ri/add-circle-line";

// 其他 Iconify 图标集
import SomeIcon from "~icons/mdi/some-icon";
```

## 注意事项

1. 离线图标需要通过 `~icons/` 前缀导入
2. 图标名称使用 kebab-case 格式
3. 建议优先使用离线图标以提升性能
