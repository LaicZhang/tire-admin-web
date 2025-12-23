# Utils 工具模块审计报告

> 审计时间: 2025-12-18
> 模块路径: `src/utils/`

---

## 模块概览

| 统计项   | 数量                                     |
| -------- | ---------------------------------------- |
| 工具文件 | 17                                       |
| 子目录   | 3 (`http/`, `localforage/`, `progress/`) |

**核心文件**:

- `auth.ts` - Token 和用户认证管理
- `http/index.ts` - HTTP 请求封装
- `tree.ts` - 树形结构操作
- `message.ts` - 消息提示封装
- `security.ts` - 安全相关工具

---

## 🔴 严重问题 (高优先级)

### 1. 树形操作函数类型安全性差

**问题描述**: `tree.ts` 中所有函数都使用 `any[]` 和 `: any` 返回类型。

**影响范围**: 所有使用树形数据的组件（菜单、权限树等）

**示例**:

```typescript
// ❌ 当前代码
export const extractPathList = (tree: any[]): any => { ... }
export const buildHierarchyTree = (tree: any[], pathList = []): any => { ... }
export const handleTree = (data: any[], ...): any => { ... }

// ✅ 建议修改
interface TreeNode<T = unknown> {
  id?: string | number;
  parentId?: string | number | null;
  children?: TreeNode<T>[];
  uniqueId?: string | number;
  pathList?: (string | number)[];
  [key: string]: unknown;
}

export const buildHierarchyTree = <T extends TreeNode>(
  tree: T[],
  pathList: (string | number)[] = []
): T[] => { ... }
```

---

### 2. 安全工具函数存在风险

**问题描述**: `security.ts` 使用 MD5 和弱随机性。

**问题点**:

1. MD5 已被证明不安全，不应用于敏感数据哈希
2. `Math.random()` 不是加密安全的随机数生成器
3. 错误处理不完整

**示例**:

```typescript
// ❌ 当前代码
export function getFileMd5(lastModified: number, size: number) {
  try {
    return getMD5(`${lastModified}${size}`);
  } catch (e) {
    throw new Error(e); // e 可能不是字符串
  }
}

export function getUsernameOfOnlyNumber() {
  return formatTimeOnlyNumber() + Math.trunc(Math.random() * 100);
}

// ✅ 建议修改
export function getFileMd5(lastModified: number, size: number): string {
  try {
    return getMD5(`${lastModified}${size}`);
  } catch (error) {
    throw new Error(error instanceof Error ? error.message : String(error));
  }
}

// 使用 crypto 生成安全随机数
export function getUsernameOfOnlyNumber(): string {
  const randomPart = crypto.getRandomValues(new Uint32Array(1))[0] % 100;
  return formatTimeOnlyNumber() + randomPart;
}
```

---

### 3. Token 处理存在潜在问题

**问题描述**: `auth.ts` 中 token 存储和解析可能存在问题。

**问题点**:

- `getToken()` 双重解析 JSON 可能失败
- Cookie 和 localStorage 数据不同步风险
- 缺少数据验证

**示例**:

```typescript
// ❌ 当前代码
export function getToken(): DataInfo<number> {
  return Cookies.get(TokenKey)
    ? JSON.parse(Cookies.get(TokenKey)) // 可能抛出 JSON 解析错误
    : storageLocal().getItem(userKey);
}

// ✅ 建议修改
export function getToken(): DataInfo<number> | null {
  try {
    const cookieToken = Cookies.get(TokenKey);
    if (cookieToken) {
      return JSON.parse(cookieToken);
    }
    return storageLocal().getItem<DataInfo<number>>(userKey);
  } catch (error) {
    console.error("Failed to parse token:", error);
    return null;
  }
}
```

---

## 🟡 中等问题 (中优先级)

### 4. HTTP 请求类型定义不完整

**问题描述**: `http/types.d.ts` 使用默认导出 class，不利于 tree-shaking。

```typescript
// ❌ 当前
export default class PureHttp { ... }

// ✅ 建议
export class PureHttp { ... }
```

---

### 5. 消息工具函数冗余代码

**问题描述**: `message.ts` 有注释掉的代码和未使用的参数。

```typescript
// 行 29, 64, 79 有注释掉的 center 参数
// center?: boolean;
```

**建议**: 移除注释掉的代码或恢复功能。

---

### 6. 缺少单元测试

**问题描述**: 工具函数缺少单元测试覆盖。

**影响**:

- `tree.ts` 的递归函数容易出错
- `auth.ts` 的 token 处理逻辑复杂

---

## 🟢 轻微问题 (低优先级)

### 7. 递归调用可能栈溢出

**问题描述**: `tree.ts` 中的递归函数对深层嵌套数据可能导致栈溢出。

**建议**: 考虑使用迭代方式或设置最大深度限制。

---

### 8. 文件组织可优化

**建议**:

```
src/utils/
├── auth/           # 认证相关
│   ├── token.ts
│   └── types.ts
├── http/           # HTTP 相关 (已有)
├── tree/           # 树形操作
│   ├── operations.ts
│   └── types.ts
└── security/       # 安全工具
    └── hash.ts
```

---

## 📋 优化建议汇总

| 优先级 | 问题             | 工作量 | 影响范围  |
| ------ | ---------------- | ------ | --------- |
| 🔴 高  | 树形操作类型安全 | 中     | 菜单/权限 |
| 🔴 高  | 安全工具函数风险 | 小     | 认证流程  |
| 🔴 高  | Token 处理问题   | 中     | 全局认证  |
| 🟡 中  | HTTP 类型定义    | 小     | API 调用  |
| 🟡 中  | 消息工具冗余代码 | 小     | 消息提示  |
| 🟡 中  | 缺少单元测试     | 大     | 全局      |
| 🟢 低  | 递归栈溢出风险   | 中     | 深层树    |

---

## 🔧 建议的行动计划

1. **第一阶段**: 修复安全和类型问题
   - 为 `tree.ts` 添加泛型类型
   - 修复 `security.ts` 的安全问题
   - 增强 `getToken()` 的错误处理

2. **第二阶段**: 代码质量改进
   - 清理注释代码
   - 统一导出方式
   - 添加 JSDoc 文档

3. **第三阶段**: 测试和重构
   - 为核心工具添加单元测试
   - 优化文件组织结构
