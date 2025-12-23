# Business 业务模块审计报告

> 审计时间: 2025-12-18
> 模块路径: `src/views/business/`

---

## 模块概览

| 子模块     | 文件数 | 复杂度 |
| ---------- | ------ | ------ |
| order      | 16     | 🔴 高  |
| customer   | 7      | 🟡 中  |
| stock      | 7      | 🟡 中  |
| tire       | 5      | 🟢 低  |
| provider   | 4      | 🟢 低  |
| warehouse  | 4      | 🟢 低  |
| 其他 12 个 | 各1-3  | 🟢 低  |

---

## 🔴 严重问题 (高优先级)

### 1. 订单模块文件过大

**问题描述**: `order/index.vue` 有 812 行代码，58 个函数。

**影响**:

- 难以维护和测试
- 编译和打包性能差
- 代码复用困难

**建议拆分方案**:

```
src/views/business/order/
├── index.vue              # 主入口，<200 行
├── composables/
│   ├── useOrderList.ts    # 列表相关逻辑
│   ├── useOrderForm.ts    # 表单相关逻辑
│   ├── useOrderActions.ts # 操作相关逻辑
│   └── useOrderTypes.ts   # 类型切换逻辑
├── components/
│   ├── OrderTable.vue     # 表格组件
│   ├── OrderSearch.vue    # 搜索组件
│   └── OrderActions.vue   # 操作按钮组
└── types.ts               # 类型定义
```

---

### 2. 单一职责原则违反

**问题描述**: `order/index.vue` 处理了 10+ 种订单类型:

- 采购订单、销售订单、理赔订单
- 退货订单、报废订单、调拨订单
- 组装订单、采购计划、采购询价、销售报价

**建议**: 每种订单类型应有独立视图或使用策略模式。

---

### 3. 表单文件过大

**问题描述**: `order/form.vue` 有 15KB，需要拆分。

---

## 🟡 中等问题 (中优先级)

### 4. 注释代码未清理

```typescript
// order/index.vue:349-353
// async function handleToggleOrder(row) {
//   await toggleOrderApi(row.uid);
//   onSearch();
// }
```

---

### 5. 重复的 API 调用模式

多个 `handleConfirm*` 函数结构相似:

```typescript
handleConfirmSaleShipment(row);
handleConfirmSaleDelivery(row);
handleConfirmTransferShipment(row);
handleConfirmTransferArrival(row);
```

**建议**: 使用策略模式或工厂函数统一处理。

---

### 6. 初始化性能问题

```typescript
// onMounted 中并行调用 7 个 API
await Promise.all([
  getOrderListInfo(),
  getAllEmployeeList(),
  getAllRepoList(),
  getManagerList(),
  getAllTireList(),
  getAllCustomerList(),
  getAllProviderList()
]);
```

**建议**: 按需加载，使用缓存或状态管理。

---

## 📋 优化建议汇总

| 优先级 | 问题            | 工作量 | 影响范围 |
| ------ | --------------- | ------ | -------- |
| 🔴 高  | 文件过大(812行) | 大     | order    |
| 🔴 高  | 违反单一职责    | 大     | order    |
| 🟡 中  | 注释代码        | 小     | 多处     |
| 🟡 中  | 重复API模式     | 中     | order    |
| 🟡 中  | 初始化性能      | 中     | order    |

---

## 🔧 建议的行动计划

1. **第一阶段**: 提取 Composables
2. **第二阶段**: 拆分订单类型
3. **第三阶段**: 优化初始化流程
