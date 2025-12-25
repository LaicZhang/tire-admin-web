# 后端安全确认清单

本文档整理了前端审计中发现的需要后端配合确认和实现的安全相关事项。

---

## 1. 登录失败限制

### 需求描述

防止暴力破解攻击，限制登录失败次数。

### 建议实现

| 配置项       | 建议值     | 说明                    |
| ------------ | ---------- | ----------------------- |
| 最大失败次数 | 5 次       | 连续失败 5 次后触发锁定 |
| 锁定时间     | 15 分钟    | 锁定后需等待 15 分钟    |
| 计数重置     | 登录成功后 | 成功登录后清除失败计数  |

### 后端 API 响应建议

```json
// 登录失败时返回
{
  "code": 401,
  "message": "用户名或密码错误",
  "data": {
    "remainingAttempts": 3,  // 剩余尝试次数
    "locked": false
  }
}

// 账户锁定时返回
{
  "code": 403,
  "message": "账户已锁定，请 15 分钟后重试",
  "data": {
    "locked": true,
    "unlockTime": "2025-12-25T20:45:00Z"  // 解锁时间
  }
}
```

### 前端展示

- 显示剩余尝试次数提示
- 锁定后显示倒计时
- 禁用登录按钮

### 确认状态

- [ ] 后端已实现登录失败计数
- [ ] 后端已实现账户锁定机制
- [ ] API 返回剩余尝试次数
- [ ] 前端已对接展示逻辑

---

## 2. CSRF Token 保护

### 需求描述

防止跨站请求伪造攻击，特别是登录、支付等敏感操作。

### 推荐方案：Double Submit Cookie

```
┌─────────────┐                    ┌─────────────┐
│   Client    │                    │   Server    │
└──────┬──────┘                    └──────┬──────┘
       │                                  │
       │  1. GET /api/csrf-token          │
       │ ────────────────────────────────>│
       │                                  │
       │  2. Set-Cookie: csrf_token=xxx   │
       │     Body: { token: "xxx" }       │
       │ <────────────────────────────────│
       │                                  │
       │  3. POST /api/login              │
       │     Cookie: csrf_token=xxx       │
       │     Header: X-CSRF-Token: xxx    │
       │ ────────────────────────────────>│
       │                                  │
       │  4. 验证 Cookie == Header        │
       │ <────────────────────────────────│
       └──────┬──────┘                    │
```

### 后端实现要点

1. **生成 Token 端点**

   ```
   GET /api/csrf-token
   Response: { token: "随机生成的 token" }
   Set-Cookie: csrf_token=xxx; HttpOnly=false; SameSite=Strict
   ```

2. **验证逻辑**
   - 比较 Cookie 中的 token 和 Header 中的 token
   - 不匹配返回 403

3. **需要保护的端点**
   - `POST /api/auth/login`
   - `POST /api/auth/logout`
   - `POST/PUT/DELETE` 所有敏感数据操作

### 前端对接

```typescript
// 在登录前获取 CSRF Token
const { token } = await fetch("/api/csrf-token").then(r => r.json());

// 登录请求携带 Token
await fetch("/api/auth/login", {
  method: "POST",
  headers: {
    "X-CSRF-Token": token,
    "Content-Type": "application/json"
  },
  body: JSON.stringify({ username, password })
});
```

### 确认状态

- [ ] 后端已实现 CSRF Token 生成端点
- [ ] 后端已在敏感操作验证 Token
- [ ] 前端 HTTP 请求已自动携带 Token

---

## 附录：其他安全建议

### 已实现

- ✅ 删除操作需二次确认（用户删除、订单删除）
- ✅ 敏感数据传输使用 HTTPS
- ✅ Token 存储在 localStorage（可考虑升级为 HttpOnly Cookie）

### 待评估

- [ ] 密码强度校验规则
- [ ] 会话超时时间配置
- [ ] 操作日志审计

---

> 最后更新：2025-12-25
