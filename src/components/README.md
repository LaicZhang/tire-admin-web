# 公共组件库

本目录包含项目可复用的 Vue 3 组件库。

## 组件列表

| 组件              | 说明           | 路径                        |
| ----------------- | -------------- | --------------------------- |
| `DeleteButton`    | 删除确认按钮   | `DeleteButton/index.vue`    |
| `ImportExport`    | 导入导出对话框 | `ImportExport/`             |
| `MoneyDisplay`    | 金额显示       | `MoneyDisplay/index.vue`    |
| `PageContainer`   | 页面容器       | `PageContainer/index.vue`   |
| `ReAuth`          | 权限控制       | `ReAuth/index.vue`          |
| `ReCol`           | 栅格列         | `ReCol/index.vue`           |
| `ReDialog`        | 对话框封装     | `ReDialog/`                 |
| `ReFlicker`       | 闪烁动画       | `ReFlicker/index.vue`       |
| `ReIcon`          | 图标组件       | `ReIcon/`                   |
| `ReImageVerify`   | 图片验证码     | `ReImageVerify/index.vue`   |
| `RePureTableBar`  | 表格工具栏     | `RePureTableBar/`           |
| `ReQrcode`        | 二维码生成     | `ReQrcode/index.vue`        |
| `ReSearchForm`    | 搜索表单       | `ReSearchForm/index.vue`    |
| `ReSegmented`     | 分段控制器     | `ReSegmented/index.vue`     |
| `ReText`          | 文本显示       | `ReText/index.vue`          |
| `SkeletonPage`    | 骨架屏页面     | `SkeletonPage/index.vue`    |
| `StatusTag`       | 状态标签       | `StatusTag/index.vue`       |
| `TableOperations` | 表格操作列     | `TableOperations/index.vue` |

## 使用示例

### DeleteButton

带确认提示的删除按钮。

```vue
<DeleteButton :title="`确认删除 ${row.name}？`" @confirm="handleDelete(row)" />
```

### ReSearchForm

统一风格的搜索表单。

```vue
<ReSearchForm
  ref="searchFormRef"
  :form="form"
  :loading="loading"
  @search="onSearch"
  @reset="onReset"
>
  <el-form-item label="名称：" prop="name">
    <el-input v-model="form.name" placeholder="请输入" />
  </el-form-item>
</ReSearchForm>
```

### StatusTag

状态标签，支持多种状态样式。

```vue
<StatusTag :status="row.status" />
```

### MoneyDisplay

金额显示，自动格式化千分位。

```vue
<MoneyDisplay :value="order.amount" :precision="2" />
```

## 懒加载使用

对于大型组件，建议使用 `defineAsyncComponent` 进行懒加载：

```typescript
import { defineAsyncComponent } from "vue";

// 懒加载组件
const HeavyComponent = defineAsyncComponent(
  () => import("./HeavyComponent.vue")
);

// 带加载状态
const AsyncComponent = defineAsyncComponent({
  loader: () => import("./AsyncComponent.vue"),
  loadingComponent: LoadingSpinner,
  delay: 200,
  errorComponent: ErrorDisplay,
  timeout: 10000
});
```

## 开发规范

1. **命名规范**：使用大驼峰 (PascalCase) 命名组件
2. **Props 定义**：使用 TypeScript 接口定义 props 类型
3. **事件命名**：使用 kebab-case，如 `@item-click`
4. **默认值**：为 props 提供合理的默认值
5. **文档注释**：在组件顶部添加功能说明注释

## 相关资源

- [Vue 3 组件开发指南](https://vuejs.org/guide/components/registration.html)
- [Element Plus 组件库](https://element-plus.org/)
