# API 错误处理指南

> 契约口径与 `docs/audit/2026-09-17-error-contract-frontend-sync-audit.md` 一致；
> 后端实现见 `be-core/src/common/filter/all-exceptions.filter.ts` 与
> `be-core/src/common/interceptor/transform.interceptor.ts`。

## 四条约定（先读这个）

1. 响应体 `code` 是 **HTTP 状态码**，不是业务码；业务分支一律判断 `errorCode`。
2. 失败响应**顶层 `errorCode` 是唯一码位**。`meta.errorCode` 是过渡期双写字段，
   仅作兜底，不要写新逻辑（后端会在前端切换完成后单独删除）。
3. 成功响应**不携带** `errorCode`，`code` 固定 `200`。
4. 码格式只有三类：业务码 `DOMAIN.REASON`、系统码 `SYSTEM.*`、传输层兜底 `HTTP_<status>`。
   其余取值一律按 `HTTP_<status>` 等价处理，不要新增分支。

## 响应结构

成功：

```json
{
  "code": 200,
  "data": {},
  "msg": "success",
  "timestamp": "2026-09-17T00:00:00.000Z",
  "path": "/api/v1/...",
  "meta": { "timestamp": "...", "path": "/api/v1/..." }
}
```

失败（HTTP 状态与响应体 `code` 一致）：

```json
{
  "code": 409,
  "errorCode": "STATE.ORDER_LOCKED",
  "msg": "订单已锁定",
  "data": null,
  "meta": {
    "timestamp": "2026-09-17T00:00:00.000Z",
    "path": "/api/v1/orders/1",
    "traceid": "...",
    "errorCode": "STATE.ORDER_LOCKED"
  }
}
```

DTO 校验失败（`VALIDATION.REQUEST_INVALID`，HTTP 400）额外带字段级明细：

```json
{
  "code": 400,
  "errorCode": "VALIDATION.REQUEST_INVALID",
  "msg": "Invalid params: 数量必须为正数",
  "data": {
    "errors": [
      {
        "field": "quantity",
        "constraint": "isPositive",
        "message": "数量必须为正数"
      },
      {
        "field": "nested.code",
        "constraint": "isNotEmpty",
        "message": "不能为空"
      }
    ]
  },
  "meta": { "errorCode": "VALIDATION.REQUEST_INVALID" }
}
```

`field` 是**嵌套路径**（点号连接）。需要高亮字段时必须读 `data.errors`，
**禁止**解析 `msg` 字符串。

## 前端解析入口

统一用 `@/utils/apiErrorContract`，不要自己写信封判定或码格式判断：

```ts
import { resolveApiError, getApiErrorCode } from "@/utils/apiErrorContract";

const res = await someApi();
if (res.code !== 200) {
  const { errorCode, kind, msg, fieldErrors } = resolveApiError(res, {
    status: <HTTP 状态码，可选>
  });
  // 分支只看 errorCode / kind，展示只看 msg，字段高亮只看 fieldErrors
}
```

`kind` 取值：

| kind        | 含义                                        | errorCode 取值           |
| ----------- | ------------------------------------------- | ------------------------ |
| `success`   | `code === 200`                              | 无（成功响应不带该字段） |
| `dynamic`   | 业务码型失败                                | `DOMAIN.REASON`          |
| `system`    | 系统码型失败                                | `SYSTEM.*`               |
| `static`    | 状态码型失败（400–599，无业务码）           | `HTTP_<code>`            |
| `transport` | 无法判定 / 码不合法（按传输层兜底等价处理） | `HTTP_<status>`          |

未匹配路由由后端兜底中间件返回统一信封（`errorCode: "HTTP_404"`，
`msg: "Cannot GET /api/v1/..."`），不再返回 HTML。

## HTTP 拦截器处理

`src/utils/http/index.ts` 中的拦截器已经处理了：

1. **Token 过期自动刷新**（仅 401；`cookie-auth` 拦截器）
2. **请求重试**（仅幂等请求 + 网络错误/超时）
3. **统一错误提示**（失败信封按 `msg` 弹 `ElMessage.error`）

注意：拦截器对**失败信封走 `resolve` 而不是 `reject`**，调用方沿用
`code !== 200` 分支即可；需要业务码时对返回的信封调用 `resolveApiError`。

## 业务层错误处理

### 推荐方式：使用 try-catch

```typescript
const handleSubmit = async () => {
  loading.value = true;
  try {
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

### 需要按业务码分支时

```typescript
const res = await createOrderApi(formData);
if (res.code !== 200) {
  const { errorCode } = resolveApiError(res);
  if (errorCode === "STATE.ORDER_LOCKED") {
    // 订单已锁定：走专属交互
  }
  return;
}
```

禁止用 HTTP 状态码代替 `errorCode` 做业务分支：同一个 `errorCode` 的 HTTP 状态
由后端注册表统一决定，历史上有过归一化调整；也禁止按 `msg` 文本分支——存在
「同文案不同码」的刻意保留对。

### 字段级错误（表单高亮）

`data.errors` 给的是后端字段路径（点号连接）。Element Plus 的表单项错误文案由
本地 `rules` 驱动，**不能**直接把后端文案塞进去；推荐做法是：

1. 用后端 `fieldErrors` 定位到表单项（路径 → 表单项 `prop` 的映射按项目实际写法转换）；
2. 用 `useFormRef(formRef).scrollToField(prop)` 滚动定位；
3. 文案用 `message(fieldErrors[0].message, { type: "warning" })` 展示。

```typescript
const { scrollToField } = useFormRef(formRef);

const res = await submitApi(form);
if (res.code !== 200) {
  const { fieldErrors, msg } = resolveApiError(res);
  const first = fieldErrors[0];
  if (first) {
    scrollToField(toFormProp(first.field));
    message(first.message, { type: "warning" });
  } else {
    message(msg ?? "提交失败", { type: "error" });
  }
  return;
}
```

### 错误分类与上报

`src/utils/http/errorHandler.ts` 提供 `classifyHttpError` / `reportHttpError`，
返回值除 `type`（按 HTTP 状态分类，语义与历史一致）外，还会带上信封里的
`errorCode` / `kind` / `fieldErrors`，便于接入 Sentry 等监控。

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
import { useConfirmDialog } from "@/composables";

const handleDelete = async (row: { uid: string; name: string }) => {
  const { confirm } = useConfirmDialog();
  const ok = await confirm(
    `确定要删除 "${row.name}" 吗？此操作不可恢复。`,
    "删除确认",
    { type: "warning" }
  );
  if (!ok) return;

  await deleteApi(row.uid);
  message("删除成功", { type: "success" });
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

### 5. 不要解析 `msg` 字符串

`msg` 只用于展示。字段定位读 `data.errors`，分支判断读 `errorCode`。

## 错误边界

对于关键页面，考虑使用 Vue 的错误边界组件或 `onErrorCaptured` 钩子捕获未处理的错误。

## 已知的码值例外（写入分支前对照）

- Prisma 底层码已收口为语义码：`P2002 → SYSTEM.DB_UNIQUE_VIOLATION`、
  `P2025/P2015 → SYSTEM.DB_RECORD_NOT_FOUND`、`P2003 → SYSTEM.DB_FOREIGN_KEY`、
  `P2034 → SYSTEM.DB_WRITE_CONFLICT` 等；原始 `P####` 只在非生产的
  `meta.prismaCode` 出现，**不要**在业务代码里引用。
- 以下旧码已合并，引用会永远不命中：
  `AUTH.SELF_AUDIT_FORBIDDEN`（→ `AUTH.CANNOT_AUDIT_OWN_DOCUMENT`）、
  `BALANCE.STOCK_INSUFFICIENT`（→ `BALANCE.AVAILABLE_STOCK_INSUFFICIENT`）、
  `RESOURCE.STORE_NOT_FOUND_IN_COMPANY`（→ `RESOURCE.STORE_NOT_FOUND_OR_NO_ACCESS`）。
- 以下成对码同文案不同状态，**刻意保留**，必须按码而不是按文案区分：
  `RESOURCE.PAYMENT_NOT_FOUND`(400) / `RESOURCE.PAYMENT_RECORD_NOT_FOUND`(404)、
  `RESOURCE.REPO_NOT_FOUND`(404) / `RESOURCE.REPO_NOT_FOUND_IN_COMPANY`(400)。
- 旧的数字业务码（`10001` 等）从未进入现行契约，历史文档中的码表已删除。

## 新增按码分支时的规矩

前端**不**持有全量码枚举（后端 827 个码，前端目前 0 处按码分支，枚举只会制造第二份真相
并需要独立发版同步）。确实需要按码分支时：

1. 只判断 `resolveApiError(...).errorCode`，不要判断 `code`（HTTP 状态）或 `msg` 文本；
2. 把码字面量写进**本文档**或 `@/utils/apiErrorContract`，不要散落在各页面 ——
   `src/utils/__tests__/apiErrorRegistry.contract.test.ts` 会把这两处出现的码字面量
   逐个对后端注册表校验，写错码或后端改名会直接测试失败；
3. 未覆盖的码必须安全降级：展示 `msg`（后端已是本地化文案），必要时用 `fieldErrors` 定位字段。