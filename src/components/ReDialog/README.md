# ReDialog 组件

可复用的对话框组件，支持命令式调用和声明式配置。

## 使用方法

### 基础用法

```typescript
import { addDialog, closeDialog, closeAllDialog } from "@/components/ReDialog";

// 打开对话框
addDialog({
  title: "对话框标题",
  contentRenderer: () =>
    h(YourComponent, {
      /* props */
    }),
  beforeSure: (done, { options }) => {
    // 点击确定按钮时的回调
    done(); // 关闭对话框
  }
});
```

### 配置选项

| 参数                | 说明                   | 类型                      | 默认值  |
| ------------------- | ---------------------- | ------------------------- | ------- |
| `title`             | 对话框标题             | `string`                  | -       |
| `width`             | 对话框宽度             | `string \| number`        | `"50%"` |
| `props`             | 传递给内容组件的 props | `object`                  | -       |
| `draggable`         | 是否可拖拽             | `boolean`                 | `false` |
| `fullscreen`        | 是否全屏               | `boolean`                 | `false` |
| `fullscreenIcon`    | 是否显示全屏切换图标   | `boolean`                 | `false` |
| `closeOnClickModal` | 点击遮罩是否关闭       | `boolean`                 | `true`  |
| `hideFooter`        | 是否隐藏底部按钮       | `boolean`                 | `false` |
| `contentRenderer`   | 内容渲染函数           | `Function`                | -       |
| `beforeSure`        | 确定前回调             | `(done, options) => void` | -       |
| `beforeCancel`      | 取消前回调             | `(done, options) => void` | -       |

### 关闭对话框

```typescript
// 关闭指定对话框
closeDialog({
  title: "对话框标题" // 或使用其他标识
});

// 关闭所有对话框
closeAllDialog();
```

## 注意事项

1. 使用 `contentRenderer` 时，通过 `h()` 函数渲染组件
2. `beforeSure` 中必须调用 `done()` 才会关闭对话框
3. 对话框状态保存在模块级变量中，在 SSR 场景下需要注意状态隔离
