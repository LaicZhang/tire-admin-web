# PureTableBar 组件

表格工具栏组件，提供标题、刷新按钮和自定义操作按钮区域。

## 使用方法

```vue
<template>
  <PureTableBar title="用户管理" @refresh="handleRefresh">
    <template #buttons>
      <el-button type="primary" @click="handleAdd">新增</el-button>
    </template>
    <template v-slot="{ size }">
      <pure-table :data="tableData" :columns="columns" />
    </template>
  </PureTableBar>
</template>
```

## Props

| 参数    | 说明     | 类型     | 默认值 |
| ------- | -------- | -------- | ------ |
| `title` | 表格标题 | `string` | -      |

## Events

| 事件名    | 说明               | 回调参数 |
| --------- | ------------------ | -------- |
| `refresh` | 点击刷新按钮时触发 | -        |

## Slots

| 名称      | 说明           | 作用域                    |
| --------- | -------------- | ------------------------- |
| `buttons` | 工具栏按钮区域 | -                         |
| `default` | 表格内容区域   | `{ size }` - 当前表格尺寸 |

## 特性

- 内置刷新按钮，点击触发 `refresh` 事件
- 支持自定义工具栏按钮
- 响应式设计，适配不同屏幕尺寸
- 与 pure-table 组件配合使用
