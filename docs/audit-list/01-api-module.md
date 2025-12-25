# API 模块审计报告

> 审计时间: 2025-12-25 (深度审计更新)
> 模块路径: `src/api/`

---

## 模块概览

| 统计项        | 数量           |
| ------------- | -------------- |
| API 入口文件  | 1 (`index.ts`) |
| 业务 API 文件 | 23             |
| 系统 API 文件 | 9              |
| 公司 API 文件 | 5              |
| 顶层 API 文件 | 15             |

---

## 🔴 严重问题 (高优先级)

### 1. 类型安全性不足

**问题描述**: 大量 API 函数使用 `object` 或 `any` 作为参数和返回类型。

**影响文件**:

- `src/api/auth.ts` - 所有 `data?: object` 参数
- `src/api/type.ts` - `CommonResult.data: any`
- `src/api/business/order.ts` - 多处 `data: object` 参数

**示例代码**:

```typescript
// ❌ 当前代码
export const getLogin = (data?: object) => { ... }
export const updateOrderApi = (type: string, uid, data: object) => { ... }

// ✅ 建议修改
export interface LoginDto {
  username: string;
  password: string;
  captchaId?: string;
  captchaCode?: string;
}
export const getLogin = (data: LoginDto) => { ... }
```

**建议**:

1. 为所有 API 请求创建专用的 DTO 接口
2. 使用泛型替代 `any` 类型: `CommonResult<T = unknown>`
3. 启用 TypeScript 严格模式 (`strict: true`)

---

### 2. URL 路径拼接方式不安全

**问题描述**: 使用字符串拼接构建 URL，可能导致路径错误或安全问题。

**影响文件**:

- `src/api/auth.ts:47` - `"/auth/company-info" + "/" + type`
- `src/api/auth.ts:69-70` - 模板字符串与函数调用混用

**示例代码**:

```typescript
// ❌ 当前代码
baseUrlApi("/auth/company-info" + "/" + type);
baseUrlApi("/auth/login-history/page") + `/${index}`;

// ✅ 建议修改
baseUrlApi(`/auth/company-info/${encodeURIComponent(type)}`);
baseUrlApi(`/auth/login-history/page/${index}`);
```

**建议**:

1. 统一使用模板字符串
2. 对用户输入的路径参数使用 `encodeURIComponent`
3. 考虑创建类型安全的 URL 构建工具

---

### 3. 参数类型丢失

**问题描述**: 部分函数参数缺少类型声明。

**影响文件**:

- `src/api/business/order.ts:34` - `uid` 参数无类型
- `src/api/business/order.ts:41` - `uid` 参数无类型

**示例代码**:

```typescript
// ❌ 当前代码
export const deleteOrderApi = (type: string, uid) => { ... }

// ✅ 建议修改
export const deleteOrderApi = (type: string, uid: string) => { ... }
```

---

## 🟡 中等问题 (中优先级)

### 4. 异步模式不一致

**问题描述**: 部分 API 使用 `async/await`，部分直接返回 Promise，风格不统一。

**示例**:

```typescript
// 混用模式
export const getCurrentCompanyAPi = async () => {
  return await http.request<CommonResult>(...);  // 不必要的 await
}

export const getLogin = (data?: object) => {
  return http.request<UserResult>(...);  // 直接返回
}
```

**建议**: 统一使用直接返回 Promise 的方式，除非需要在函数内处理数据。

---

### 5. API 命名不规范

**问题描述**: 函数命名存在拼写错误和命名风格不一致。

**示例**:

- `getCurrentCompanyAPi` - 应为 `getCurrentCompanyApi` (大小写错误)
- 混用 `Api` 和 `API` 后缀

**建议**: 统一使用 `Api` 后缀，遵循 camelCase 命名规范。

---

### 6. 重复代码模式

**问题描述**: `order.ts` 中存在大量结构相似的 CRUD 函数。

**示例**:

```typescript
// 多个类似的函数
export const createPurchaseOrderDetailApi = (uid: string) => { ... }
export const createSaleOrderDetailApi = (uid: string) => { ... }
export const createClaimOrderDetailApi = (uid: string) => { ... }
```

**建议**: 考虑使用工厂函数或泛型减少重复：

```typescript
const createOrderDetailApi =
  <T extends OrderType>(type: T) =>
  (uid: string) =>
    http.request<CommonResult>(
      "post",
      baseUrlApi(`${getOrderPrefix(type)}detail/${uid}`)
    );
```

---

## 🟢 轻微问题 (低优先级)

### 7. 缺少 JSDoc 注释

**问题描述**: 大部分 API 函数缺少文档注释，难以理解接口用途和参数含义。

**建议**: 添加 JSDoc 注释说明参数和返回值。

---

### 8. 缺少错误处理指南

**问题描述**: 没有统一的 API 错误处理策略文档或类型定义。

**建议**:

1. 定义统一的错误响应类型
2. 创建错误处理工具函数

---

### 9. 索引签名滥用

**问题描述**: 类型定义中大量使用 `[key: string]: any`。

**影响文件**: `src/api/type.ts`

```typescript
// ❌ 当前代码
export type PaymentAccount = {
  uid: string;
  [key: string]: any; // 允许任意属性
};
```

**建议**: 明确定义所有属性，避免索引签名。

---

## 📋 优化建议汇总

| 优先级 | 问题               | 工作量 | 影响范围 |
| ------ | ------------------ | ------ | -------- |
| 🔴 高  | 类型安全性不足     | 大     | 全局     |
| 🔴 高  | URL 路径拼接不安全 | 中     | 多处     |
| 🔴 高  | 参数类型丢失       | 小     | 局部     |
| 🟡 中  | 异步模式不一致     | 小     | 全局     |
| 🟡 中  | API 命名不规范     | 小     | 局部     |
| 🟡 中  | 重复代码模式       | 中     | order.ts |
| 🟢 低  | 缺少 JSDoc 注释    | 中     | 全局     |
| 🟢 低  | 缺少错误处理指南   | 中     | 全局     |

---

## 🔧 建议的行动计划

1. **第一阶段** (紧急): 修复类型安全问题
   - 为核心 API 创建 DTO 接口
   - 修复 URL 拼接问题

2. **第二阶段** (重要): 代码规范化
   - 统一命名规范
   - 统一异步模式
   - 重构重复代码

3. **第三阶段** (改进): 文档和工具
   - 添加 JSDoc 注释
   - 创建错误处理工具
   - 启用 TypeScript 严格模式
