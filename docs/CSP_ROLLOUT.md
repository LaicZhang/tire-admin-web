# CSP Rollout（Report-Only → Enforce）

目标：先通过 `Content-Security-Policy-Report-Only` 观测违规来源，逐步补齐白名单/改造内联资源，最终在 staging/生产切换到 `Content-Security-Policy`（强制）以降低 XSS 风险面。

## 现状

- Report-Only 配置：`tire-admin-web/nginx.conf`
- Enforce 配置：`tire-admin-web/nginx.csp-enforce.conf`
- 镜像构建支持 `CSP_MODE` 开关：`tire-admin-web/Dockerfile`

## Rollout 步骤（建议）

1. **Phase 0（默认）Report-Only**
   - 保持 `Content-Security-Policy-Report-Only`，在浏览器控制台/监控侧收集违规来源。
   - 若需要上报：可在 Nginx/后端增加 `report-to`/`report-uri` 接收与统计（按你们的监控体系落地）。

2. **Phase 1（staging）Enforce（不允许内联 script）**
   - 构建 staging 镜像时启用 `CSP_MODE=enforce`，将 header 切为 `Content-Security-Policy`。
   - `index.html` 已移除内联 `<script>`，避免必须依赖 `script-src 'unsafe-inline'`。
   - 重点回归：登录、菜单/路由切换、核心业务页面、常用弹窗组件。

3. **Phase 2（逐步收紧）**
   - 移除不必要的源（优先 `connect-src`、`img-src` 等），清理 `http:` 兜底（若生产全站 https）。
   - 评估 `style-src 'unsafe-inline'` 的替代（避免内联 style/style 属性：需要按页面/组件逐步改造，成本较高）。

## 回滚方式

- 直接使用 Report-Only 配置重新构建镜像即可回滚：
  - `docker build -t tire-admin-web:staging .`（默认 `CSP_MODE=report-only`）
- 或显式指定：
  - `docker build -t tire-admin-web:staging --build-arg CSP_MODE=report-only .`

## 构建示例

- **staging（enforce）**
  - `docker build -t tire-admin-web:staging --build-arg CSP_MODE=enforce .`
- **默认（report-only）**
  - `docker build -t tire-admin-web:latest .`
