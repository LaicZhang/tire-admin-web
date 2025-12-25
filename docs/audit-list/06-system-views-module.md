# System 系统管理模块审计报告

> 审计时间: 2025-12-25 (深度审计更新)
> 模块路径: `src/views/system/`

---

## 模块概览

| 子模块     | 文件数 | 状态 |
| ---------- | ------ | ---- |
| companies  | 5      | 完整 |
| dict       | 1      | 基础 |
| document   | 1      | 基础 |
| feedback   | 4      | 完整 |
| file       | 1      | 基础 |
| log        | 1      | 基础 |
| menu       | 5      | 完整 |
| notice     | 1      | 基础 |
| permission | 5      | 完整 |
| print      | 1      | 基础 |
| role       | 4      | 完整 |
| task       | 1      | 基础 |
| user       | 5      | 完整 |
| workflow   | 1      | 基础 |

---

## 🔴 严重问题 (高优先级)

### 1. 未使用的函数和变量

**问题描述**: 多处存在未使用的导入和变量。

```typescript
// user/index.vue:98-102 - getDetails 未在模板中正确关联
const getDetails = async row => {
  loading.value = true;
  const { data, code, msg } = await getOneUserApi(row.uid);
  loading.value = false; // data, code, msg 未使用
};

// user/index.vue:3-5 - Eye 图标导入了但使用方式可能有问题
import Eye from "~icons/ep/view";
```

---

### 2. 空函数/占位函数

**问题描述**: 存在空的事件处理函数。

```typescript
// user/index.vue:81-83
const handleChange = () => {
  // 处理变化
};
```

**建议**: 移除无用函数或实现具体逻辑。

---

### 3. 缺少错误处理

**问题描述**: API 调用缺少统一的错误处理。

```typescript
// user/index.vue:147-150
const deleteOne = async row => {
  await deleteUserApi(row.uid); // 无 try-catch
  message("删除成功", { type: "success" });
  handleSearch();
};

// ✅ 建议
const deleteOne = async row => {
  try {
    await deleteUserApi(row.uid);
    message("删除成功", { type: "success" });
    handleSearch();
  } catch (error) {
    message("删除失败", { type: "error" });
  }
};
```

---

## 🟡 中等问题 (中优先级)

### 4. 函数命名不一致

```typescript
// user/index.vue 使用 "handleRest" 应为 "handleReset"
const handleRest = () => { ... }

// role/index.vue 使用 "handleReset"
const handleReset = () => { ... }
```

---

### 5. 表单列配置选项错误

```typescript
// user/index.vue:60-79 - 状态选项与用户状态语义不符
options: [
  { label: "已解决", value: "1" }, // 应为 "启用"
  { label: "未解决", value: "0" }, // 应为 "禁用"
  { label: "解决中", value: "2" } // 用户状态不应有此选项
];
```

---

### 6. 分页逻辑不完整

**问题描述**: `columns.tsx` 中 `onCurrentChange` 只有加载动画，没有实际请求。

```typescript
// role/columns.tsx:86-91
function onCurrentChange(_val: number) {
  loading.value = true;
  delay(300).then(() => {
    loading.value = false;
  });
  // 缺少实际的数据请求
}
```

---

## 🟢 轻微问题 (低优先级)

### 7. 基础模块待完善

以下模块只有基础文件，功能不完整:

- `dict` - 字典管理
- `document` - 文档管理
- `file` - 文件管理
- `log` - 日志管理
- `notice` - 公告管理
- `print` - 打印管理
- `task` - 任务管理
- `workflow` - 工作流管理

---

### 8. 重复的样式代码

多个 `index.vue` 文件包含相同的样式:

```scss
.main {
  margin: 20px;
}
:deep(.el-card) {
  border: none;
  box-shadow: none;
}
```

**建议**: 提取到全局样式或混入。

---

## 📋 优化建议汇总

| 优先级 | 问题           | 工作量 | 影响范围    |
| ------ | -------------- | ------ | ----------- |
| 🔴 高  | 未使用的变量   | 小     | user.vue    |
| 🔴 高  | 缺少错误处理   | 中     | 全局        |
| 🟡 中  | 函数命名不一致 | 小     | user.vue    |
| 🟡 中  | 表单选项错误   | 小     | user.vue    |
| 🟡 中  | 分页逻辑不完整 | 中     | columns.tsx |
| 🟢 低  | 基础模块待完善 | 大     | 8个模块     |
| 🟢 低  | 重复样式代码   | 小     | 全局        |

---

## 🔧 建议的行动计划

1. **第一阶段**: 修复代码问题
   - 移除未使用变量
   - 添加错误处理
   - 修正命名错误

2. **第二阶段**: 完善基础模块
   - 按优先级完善缺失模块
   - 统一代码风格
