# tire-admin-web — Agent Guide（摘要）

> 说明：下列路径均以 `tire-admin-web/` 为根目录。

## TL;DR

- 管理后台 SPA：Vue 3 + Vite + TypeScript + Pinia + Element Plus + TailwindCSS
- 入口：`src/main.ts`
- API 调用：统一走 `src/utils/http`；URL 用 `baseUrlApi('/xxx')`（`src/api/utils.ts`，自动加 `/api/v1` 前缀）
- 权限：页面级用路由 `meta.roles`；按钮级用 `<Auth :value="'perm.code' | ['perm.code']">`
- 运行时平台配置：`public/platform-config.json`（字段类型见 `types/global.d.ts` 的 `PlatformConfigs`）
- 合入前自检：`pnpm typecheck && pnpm lint:check && pnpm test && pnpm build --mode staging`

## 常用命令

- 开发：`pnpm dev`
- 类型检查：`pnpm typecheck`
- 规范检查：`pnpm lint:check`（只读）或 `pnpm lint`（自动修复后格式化）
- 构建：`pnpm build`

## 环境变量（常用）

- 端口：`VITE_PORT`（默认 8848）
- 开发代理：`/api/v1` → `VITE_PROXY_TARGET` → `VITE_SERVER_URL` → `http://localhost:3000`
- 生产/预发：优先使用 `.env.*` 的 `VITE_SERVER_URL`；不要在业务代码里硬编码后端地址

## 开发约定（高频）

- 页面/模块尽量沿用现有结构：`src/views/business/<module>/{index.vue, form.vue, table.tsx, columns.ts(x)}`
- 组件库优先用 Element Plus；弹窗/表格优先复用项目内 `ReDialog`、`RePureTableBar` 等组件
- TypeScript：确保类型安全；类型集中维护在 `types/` 或 `src/api/type.ts` 等既有位置
- 提交前清理多余 `console.*`；不要提交构建产物（`dist/`、`node_modules/`、报告文件等）
- 如果必须对某个功能进行隔离测试，先列出它所有可能失败的情况，再编写代码

## 参考

- 详细版：`docs/AGENTS_FULL.md`
- 组件用法：`docs/components-usage.md`