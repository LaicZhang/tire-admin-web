# Composables

Vue 3 组合式函数 (Composables) 目录，提供可复用的逻辑封装。

## 可用 Composables

### `useCrud`

通用 CRUD 操作封装，支持分页、加载状态、删除确认。

```typescript
import { useCrud } from "@/composables";

const { loading, dataList, pagination, fetchData, handleDelete } = useCrud({
  api: getUserListApi,
  deleteApi: deleteUserApi,
  params: () => searchForm,
  immediate: true
});
```

### `useIdleLoad`

使用 `requestIdleCallback` 延迟执行非关键任务，优化首屏性能。

```typescript
import { useIdleLoad } from "@/composables";

// 自动延迟加载
useIdleLoad(() => {
  loadNonCriticalData();
});

// 手动控制
const { execute, cancel } = useIdleLoad(() => loadData(), { immediate: false });
```

### `useFileValidation`

文件上传验证，支持类型、大小、数量限制。

```typescript
import { useFileValidation } from "@/composables";

const { validateFile, validateFiles } = useFileValidation({
  maxSize: 10 * 1024 * 1024, // 10MB
  allowedTypes: ["image/png", "image/jpeg"],
  maxCount: 5
});
```

### `useImportExport`

Excel 导入导出功能封装。

```typescript
import { useImportExport } from "@/composables";

const { exportToExcel, importFromExcel } = useImportExport();
```

### `useVirtualList` ⚡ 性能优化

大列表虚拟滚动，只渲染可见区域元素。

```typescript
import { useVirtualList } from "@/composables";

const items = ref(Array.from({ length: 10000 }, (_, i) => ({ id: i })));

const { containerRef, visibleList, containerStyle, wrapperStyle, scrollTo } =
  useVirtualList({
    list: items,
    itemHeight: 50,
    containerHeight: 400,
    overscan: 5
  });
```

```vue
<template>
  <div ref="containerRef" :style="containerStyle">
    <div :style="wrapperStyle">
      <div v-for="{ data, index } in visibleList" :key="index">
        {{ data.id }}
      </div>
    </div>
  </div>
</template>
```

### `useA11y` ♿ 可访问性

开发环境可访问性检查工具。

```typescript
import { useA11y } from "@/composables";

const { issues, check, checking } = useA11y({
  autoCheck: true, // 开发环境自动检查
  minContrastRatio: 4.5 // WCAG AA 标准
});
```

**检查项目：**

- 图片 alt 属性
- 表单元素标签
- 按钮可访问名称
- 颜色对比度

### `useFormValidation` ✅ 表单验证

统一的表单验证逻辑，包含预定义验证器。

```typescript
import { useFormValidation, validators } from "@/composables";

const formData = ref({ name: "", email: "", phone: "" });

const { fieldState, isValid, validateAll, firstError } = useFormValidation({
  formData,
  rules: {
    name: [validators.required(), validators.minLength(2)],
    email: [validators.required(), validators.email()],
    phone: [validators.phone()]
  }
});

// 提交时验证
async function handleSubmit() {
  if (await validateAll()) {
    // 提交表单
  }
}
```

**预定义验证器：**

| 验证器            | 说明       | 示例                           |
| ----------------- | ---------- | ------------------------------ |
| `required`        | 必填       | `validators.required()`        |
| `minLength`       | 最小长度   | `validators.minLength(2)`      |
| `maxLength`       | 最大长度   | `validators.maxLength(50)`     |
| `email`           | 邮箱格式   | `validators.email()`           |
| `phone`           | 手机号     | `validators.phone()`           |
| `range`           | 数值范围   | `validators.range(1, 100)`     |
| `positiveInteger` | 正整数     | `validators.positiveInteger()` |
| `pattern`         | 正则匹配   | `validators.pattern(/\d+/, m)` |
| `custom`          | 自定义验证 | `validators.custom(fn, msg)`   |

## 使用规范

1. Composable 函数名以 `use` 开头
2. 返回响应式数据和方法
3. 在 `setup()` 或 `<script setup>` 中调用
4. 需要清理的资源在 `onUnmounted` 中处理
