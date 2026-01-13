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

## 使用规范

1. Composable 函数名以 `use` 开头
2. 返回响应式数据和方法
3. 在 `setup()` 或 `<script setup>` 中调用
4. 需要清理的资源在 `onUnmounted` 中处理
