# API 错误处理指南

## 概述

本文档定义了项目中 API 错误处理的统一策略和最佳实践。

## 错误响应结构

所有 API 响应遵循统一的结构：

```typescript
interface CommonResult<T = unknown> {
  code: number; // 状态码，200 表示成功
  msg: string; // 提示信息
  data: T; // 响应数据
}
```

### 常见状态码

| 状态码 | 说明         | 处理方式           |
| ------ | ------------ | ------------------ |
| `200`  | 成功         | 正常处理 data      |
| `400`  | 请求参数错误 | 显示 msg 错误提示  |
| `401`  | 未授权       | 跳转登录页         |
| `403`  | 无权限       | 显示权限不足提示   |
| `404`  | 资源不存在   | 显示资源不存在提示 |
| `500`  | 服务器错误   | 显示通用错误提示   |

## HTTP 拦截器处理

`src/utils/http/index.ts` 中的拦截器已经处理了：

1. **Token 过期自动刷新**
2. **请求重试**（仅对幂等请求）
3. **统一错误提示**

```typescript
// 响应拦截器自动处理错误
instance.interceptors.response.use(
  response => response.data,
  error => {
    if (!error.isCancelRequest) {
      const message = error.response?.data?.msg || error.message || "请求失败";
      ElMessage.error(message);
    }
    return Promise.reject(error);
  }
);
```

## 业务层错误处理

### 推荐方式：使用 try-catch

```typescript
const handleSubmit = async () => {
  try {
    loading.value = true;
    await createOrderApi(formData);
    message("创建成功", { type: "success" });
    router.push("/orders");
  } catch (error) {
    // 拦截器已显示错误，这里可以做额外处理
    console.error("创建订单失败:", error);
  } finally {
    loading.value = false;
  }
};
```

### 需要自定义错误处理时

```typescript
const handleDelete = async (id: string) => {
  try {
    await deleteApi(id);
    message("删除成功", { type: "success" });
    refreshList();
  } catch (error) {
    // 自定义错误处理
    if (error.response?.status === 409) {
      message("该记录正在使用中，无法删除", { type: "warning" });
    }
    // 其他错误已被拦截器处理
  }
};
```

## 最佳实践

### 1. 始终使用 loading 状态

```typescript
const loading = ref(false);

const fetchData = async () => {
  loading.value = true;
  try {
    const { data } = await getDataApi();
    // 处理数据
  } finally {
    loading.value = false;
  }
};
```

### 2. 删除等危险操作需要确认

```typescript
import { ElMessageBox } from "element-plus";

const handleDelete = async (row: { uid: string; name: string }) => {
  try {
    await ElMessageBox.confirm(
      `确定要删除 "${row.name}" 吗？此操作不可恢复。`,
      "删除确认",
      { type: "warning" }
    );
    await deleteApi(row.uid);
    message("删除成功", { type: "success" });
  } catch (error) {
    if (error !== "cancel") {
      // 非用户取消的错误
    }
  }
};
```

### 3. 表单验证优先于 API 调用

```typescript
const handleSubmit = async () => {
  const valid = await formRef.value?.validate();
  if (!valid) return;

  // 验证通过后再调用 API
  await submitApi(formData);
};
```

### 4. 使用 async/await 而非 .then()

```typescript
// ✅ 推荐
const result = await fetchApi();

// ❌ 不推荐
fetchApi().then(result => { ... });
```

## 错误边界

对于关键页面，考虑使用 Vue 的错误边界组件或 `onErrorCaptured` 钩子捕获未处理的错误。
