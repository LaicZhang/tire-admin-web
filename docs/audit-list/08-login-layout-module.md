# Login 登录模块 & Layout 布局模块审计报告

> 审计时间: 2025-12-25 (最终更新)
> 模块路径: `src/views/login/`, `src/layout/`

---

## 模块概览

| 模块   | 统计项     | 详情                                                                    |
| ------ | ---------- | ----------------------------------------------------------------------- |
| Login  | 文件数     | 10 (1主入口 + 4组件 + 5工具)                                            |
| Login  | 主入口行数 | 349 行 (`index.vue`)                                                    |
| Login  | 组件       | `phone.vue`, `qrCode.vue`, `register.vue`, `update.vue`                 |
| Layout | 文件数     | 42 (含组件子目录)                                                       |
| Layout | 主入口行数 | 235 行 (`index.vue`)                                                    |
| Layout | Hooks      | 5 (`useBoolean`, `useDataThemeChange`, `useLayout`, `useNav`, `useTag`) |

---

## 🟡 中等问题 (中优先级) - 延迟处理

### 1. 登录表单事件监听

**文件**: `src/views/login/index.vue`

**状态**: 📝 延迟处理 - 使用 `onBeforeUnmount` 清理，功能正常。可选改用 VueUse。

---

### 2. Layout 目录结构优化

**状态**: 📝 延迟处理 - 涉及大量文件移动，建议专门重构周期处理。

---

## 🔐 安全状态

| 项目               | 状态      | 说明                 |
| ------------------ | --------- | -------------------- |
| 密码输入           | ✅ 已实现 | `show-password` 属性 |
| 验证码             | ✅ 已实现 | 后端生成的图形验证码 |
| 密码复杂度前端校验 | ✅ 已实现 | `REGEXP_PWD` 正则    |
| 登录失败限制       | ⚠️ 后端   | 需检查后端实现       |
| 2FA                | ❌ 未实现 | 可选功能             |
| CSRF Token         | ⚠️ 后端   | 需检查登录 API       |
