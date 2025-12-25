# Store 状态管理模块审计报告

> 审计时间: 2025-12-25 (深度审计更新)
> 模块路径: `src/store/`

---

## 模块概览

| 统计项       | 数量                       |
| ------------ | -------------------------- |
| Store 模块   | 8                          |
| 类型定义文件 | 1 (`types.ts`)             |
| 工具文件     | 2 (`index.ts`, `utils.ts`) |

**核心模块**:

- `user.ts` - 用户状态管理
- `permission.ts` - 权限与菜单管理
- `company.ts` - 公司信息管理
- `app.ts` - 应用全局状态
- `multiTags.ts` - 标签页管理

---

## 🔴 严重问题 (高优先级)

### 1. 类型定义使用 `any`

**问题描述**: `types.ts` 中 `multiType.meta` 使用 `any` 类型。

```typescript
// ❌ 当前代码 (types.ts:31)
export type multiType = {
  path: string;
  name: string;
  meta: any; // 应明确定义
  query?: object;
  params?: object;
};

// ✅ 建议修改
interface RouteMeta {
  title?: string;
  icon?: string;
  roles?: string[];
  keepAlive?: boolean;
  showLink?: boolean;
  // ... 其他 meta 属性
}

export type multiType = {
  path: string;
  name: string;
  meta: RouteMeta;
  query?: Record<string, string>;
  params?: Record<string, string>;
};
```

---

### 2. 权限 Store 类型断言滥用

**问题描述**: `permission.ts` 中多处使用 `as any` 强制类型转换。

```typescript
// ❌ 当前代码 (permission.ts:32-34)
this.flatteningRoutes = formatFlatteningRoutes(
  this.constantMenus.concat(routes) as any
) as any;
```

**建议**: 为 `formatFlatteningRoutes` 和相关函数添加正确的泛型类型。

---

### 3. 函数参数缺少类型

**问题描述**: 多处 action 方法参数缺少类型声明。

```typescript
// ❌ app.ts
setLayout(layout) { ... }      // layout 无类型
setViewportSize(size) { ... }  // size 无类型

// ✅ 建议
setLayout(layout: string): void { ... }
setViewportSize(size: { width: number; height: number }): void { ... }
```

---

## 🟡 中等问题 (中优先级)

### 4. Promise 构造反模式

**问题描述**: `company.ts` 使用不必要的 Promise 包装。

```typescript
// ❌ 当前代码 (company.ts:33-55)
async handleCurrentCompany() {
  return new Promise((resolve, reject) => {
    getCurrentCompanyAPi()
      .then(res => { ... resolve(data); })
      .catch(error => { reject(error); });
  });
}

// ✅ 建议修改
async handleCurrentCompany() {
  const res = await getCurrentCompanyAPi();
  const data = res.data;
  if (data.length === 0) {
    throw new Error("当前用户没有公司信息");
  }
  if (data.length === 1) {
    this.SET_CURRENT_COMPANY({
      companyName: data[0].name,
      companyId: data[0].uid
    });
  }
  return data;
}
```

---

### 5. 重复的存储逻辑

**问题描述**: `company.ts` 中 `SET_CURRENT_COMPANY` 和 `setCurrentCompanyKey` 功能重复。

```typescript
// company.ts 中存在两个相似函数
SET_CURRENT_COMPANY(company: CurrentCompanyInfo) { ... }
export function setCurrentCompanyKey(company: CurrentCompanyInfo) { ... }
```

**建议**: 统一使用 store action，移除外部函数。

---

### 6. State 初始化重复代码

**问题描述**: 多个 store 中从 localStorage 读取初始值的代码重复。

```typescript
// user.ts 中多次调用
storageLocal().getItem<DataInfo<number>>(userKey)?.avatar ?? "";
storageLocal().getItem<DataInfo<number>>(userKey)?.username ?? "";
// ... 重复 6 次
```

**建议**: 一次性读取并解构。

```typescript
state: (): userType => {
  const stored = storageLocal().getItem<DataInfo<number>>(userKey);
  return {
    avatar: stored?.avatar ?? "",
    username: stored?.username ?? ""
    // ...
  };
};
```

---

## 🟢 轻微问题 (低优先级)

### 7. Action 命名风格不一致

**问题描述**: 混用大写和驼峰命名。

- `SET_NAME`, `SET_ID` (全大写)
- `handleCurrentCompany`, `toggleSideBar` (驼峰)

**建议**: 统一使用驼峰命名 (`setName`, `setId`)。

---

### 8. 缺少 Getter 类型注解

**问题描述**: getter 返回类型依赖推断，可能不精确。

```typescript
// ✅ 建议添加返回类型
getters: {
  getSidebarStatus(state): boolean {
    return state.sidebar.opened;
  }
}
```

---

## 📋 优化建议汇总

| 优先级 | 问题             | 工作量 | 影响范围   |
| ------ | ---------------- | ------ | ---------- |
| 🔴 高  | meta 使用 any    | 中     | 路由/菜单  |
| 🔴 高  | 类型断言滥用     | 中     | 权限管理   |
| 🔴 高  | 参数缺少类型     | 小     | 多处       |
| 🟡 中  | Promise 反模式   | 小     | company.ts |
| 🟡 中  | 重复存储逻辑     | 小     | company.ts |
| 🟡 中  | State 初始化重复 | 小     | user.ts    |
| 🟢 低  | 命名风格不一致   | 小     | 全局       |

---

## 🔧 建议的行动计划

1. **第一阶段**: 类型安全修复
   - 定义 `RouteMeta` 接口
   - 为所有参数添加类型
   - 移除 `as any` 断言

2. **第二阶段**: 代码简化
   - 使用现代 async/await
   - 消除重复代码
   - 统一命名规范
