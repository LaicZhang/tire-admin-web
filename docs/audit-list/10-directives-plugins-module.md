# Directives 指令 & Plugins 插件模块审计报告

> 审计时间: 2025-12-25 (最终更新)
> 模块路径: `src/directives/`, `src/plugins/`

---

## 模块概览

### Directives 指令

| 指令          | 文件                 | 功能                 |
| ------------- | -------------------- | -------------------- |
| `v-auth`      | `auth/index.ts`      | 权限控制             |
| `v-copy`      | `copy/index.ts`      | 文本复制（双击复制） |
| `v-longpress` | `longpress/index.ts` | 长按事件             |
| `v-optimize`  | `optimize/index.ts`  | 性能优化             |
| `v-ripple`    | `ripple/index.ts`    | 水波纹效果           |

### Plugins 插件

| 插件             | 行数 | 功能                  |
| ---------------- | ---- | --------------------- |
| `echarts.ts`     | 45   | ECharts 按需引入      |
| `elementPlus.ts` | 16   | Element Plus 指令注册 |

---

## ✅ 亮点

| 项目                      | 说明                                        |
| ------------------------- | ------------------------------------------- |
| Copy 指令类型扩展         | 使用 `interface CopyEl extends HTMLElement` |
| ECharts 按需引入          | 仅导入使用的图表和组件                      |
| useEventListener 自动清理 | Copy 指令使用 VueUse 管理事件监听           |
| 权限指令设计              | 支持权限动态变更后恢复显示 + remove 模式    |

---

> ✅ 本模块所有已知问题均已修复，代码质量良好。
