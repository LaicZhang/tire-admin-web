# AGENTS.md

本文件是面向在本仓库中协作的智能编码代理（Agents）的工作手册与约束。其作用域为整个仓库，针对代码风格、目录约定、运行与构建、常见开发任务模板、安全与提交规范等给出明确指导。请严格遵守本文件与直接来自用户/对话中的指令；如有冲突，以用户/对话中的直接指令为准。

---

## 代码设计

- 不要过度设计，遵循KISS原则和轻量化原则。
- 尽量复用已有代码，避免重复开发。
- 不要在一个文件里添加太多内容，保持文件简洁。

---

## 1. 项目概览

- 应用类型：轮胎贸易行业的库存与订单管理后台（SPA）。
- 技术栈：
  - 前端：Vue 3、TypeScript、Vite、Pinia、Vue Router、Element Plus、Tailwind CSS、ECharts、Axios
  - 工具链：ESLint 9（Antfu 配置为主）、Stylelint、Prettier、Husky + lint-staged、Commitlint、SVGO、Rollup 可视化、Vite 插件体系
- 运行环境：Node 20.19+ / 22.13+ / 24+，pnpm ≥ 10（通过 only-allow 强制）
- 包管理：`pnpm`（必须）。
- 生产部署：静态站点（可通过 Docker + Nginx、Vercel、对象存储/云托管等方式），HTML5 History 通过 `vercel.json` 重写到 `index.html`。

参考文件：

- package.json:1
- vite.config.ts:1
- vercel.json:1

---

## 2. 快速开始

- 前置要求：
  - 安装 Node 与 pnpm；推荐使用 Corepack 管理 pnpm 版本：
    - `corepack enable && corepack prepare pnpm@10 --activate`
  - 确保 Node 与 pnpm 版本满足 package.json:engines 要求。

- 安装依赖：
  - `pnpm i`

- 本地开发：
  - `pnpm dev`
  - 默认端口通过 `.env.*` 的 `VITE_PORT` 控制（默认 8848），开放 `0.0.0.0` 监听。
  - 开发代理：`/api` → `http://localhost:3000`（可在 vite.config.ts:server.proxy 调整）。

- 类型检查与规范：
  - `pnpm typecheck`（tsc + vue-tsc）
  - `pnpm lint`（ESLint + Prettier + Stylelint，全量）
  - 提交前会触发 Husky 的 lint-staged 与 commitlint 检查。

- 构建与预览：
  - `pnpm build`（产物至 `dist/`）
  - `pnpm preview` 或 `pnpm preview:build`
  - 产物分析：`pnpm report`（生成 rollup 可视化报告 `report.html`）

参考文件：

- package.json:1
- vite.config.ts:13
- build/optimize.ts:1
- .husky/pre-commit:1
- .husky/commit-msg:1
- .lintstagedrc:1

---

## 3. 运行时配置（必须）

- 动态平台配置文件：`public/platform-config.json`
  - 应用启动时在 `src/main.ts` 中通过 `getPlatformConfig` 加载并注入到 `app.config.globalProperties.$config`。
  - 该文件用于控制主题、布局、标签页、Logo、是否缓存异步路由等。
  - 字段类型参考 `types/global.d.ts` 的 `PlatformConfigs`。

- 常见字段示例：
  - `Title`、`Layout`、`Theme`、`DarkMode`、`EpThemeColor`、`ResponsiveStorageNameSpace` 等。

参考文件：

- src/main.ts:1
- src/config/index.ts:1
- public/platform-config.json:1
- types/global.d.ts:1

---

## 4. 目录结构与职责

仅列出重要目录与约定，新增代码请遵循对应模式：

- `src/main.ts`：应用入口，注册 Router、Pinia、全局指令、全局组件、Element Plus 与 ECharts 插件、主题/样式。
- `src/router/`
  - `modules/*.ts`：静态路由声明（除 `remaining.ts`），用于生成菜单与权限控制。字段需包含 `name/path/meta.roles/title/icon/rank/isShow` 等；叶子节点指定 `component` 懒加载。
  - `modules/remaining.ts`：登录、重定向等非菜单路由。
  - `utils.ts`：路由排序、扁平化、动态路由处理、权限工具（如 `hasAuth`、`getHistoryMode`）。
- `src/store/`
  - `modules/`：Pinia 模块（`user`、`permission`、`multiTags`、`company`、`settings`、`app`、`epTheme` 等）。统一通过 `useXxxStoreHook()` 使用。
- `src/api/`
  - 统一的接口分层：`auth.ts`、`user.ts`、`company/*`、`business/*` 等。
  - 使用 `http` 封装（Axios 拦截与无感刷新），并用 `baseUrlApi()` 为相对路径自动加 `/api` 前缀（dev 环境由 Vite 代理到后端）。
  - 通用类型见 `src/api/type.ts`。
- `src/utils/http/`：Axios 实例、请求/响应拦截、刷新 Token、统一 `get/post` 包装。
- `src/views/`：页面视图，业务模块通常采用如下结构：
  - `index.vue` + `form.vue` + `table.tsx` + `columns.ts(x)`（表格列可用 TSX/配置式写法，命名与示例保持一致）。
- `src/components/`：可复用组件（`ReDialog`、`RePureTableBar`、`ReIcon`、`ReAuth`、`ReQrcode` 等）。
- `src/directives/`：自定义指令（`v-auth`、`v-longpress`、`v-optimize:debounce|throttle`、`v-ripple`）。
- `src/plugins/`：`useElementPlus` 与 `useEcharts` 的插件化注册。
- `src/style/`：全局 SCSS 与 Tailwind（务必在 `main.ts` 先引入 `tailwind.css`，避免 HMR 时整包样式大体积回传）。
- `build/`：Vite 插件列表、CDN/压缩配置、构建信息、依赖预构建 include/exclude、环境变量包装等。
- `types/`：全局类型声明（含 `ViteEnv`、`PlatformConfigs`、`TableColumnList` 等）。

参考文件：

- src/router/index.ts:1
- src/router/modules/auth.ts:1
- src/router/modules/remaining.ts:1
- src/router/utils.ts:1
- src/api/index.ts:1
- src/utils/http/index.ts:1
- src/views/business/tire/index.vue:1
- src/views/business/tire/table.tsx:1
- src/views/business/customer/columns.ts:1
- src/components/ReAuth/src/auth.tsx:1
- src/directives/index.ts:1
- src/plugins/elementPlus.ts:1
- src/plugins/echarts.ts:1
- src/style/index.scss:1
- build/plugins.ts:1
- types/global.d.ts:1

---

## 5. 代码风格与约束

- 语言与范式：TypeScript + Vue 3 Composition API。支持 SFC `<script setup>` 与 TSX（部分表格/列配置采用 TSX）。
- 模块导入：
  - 使用路径别名：`@/` 指向 `src/`，`@build/` 指向 `build/`（见 tsconfig.json:paths）。
  - 遵守 ESLint 关于一致化类型导入（`@typescript-eslint/consistent-type-imports`）。
- 组件与视图：
  - 命名与目录保持与现有模块一致（如 `views/business/<module>/{index.vue, form.vue, table.tsx, columns.tsx}`）。
  - UI 库统一使用 Element Plus（插件已全量注册，一般无需局部引入）。
- 状态管理：
  - Pinia 模块通过 `useXxxStoreHook()` 获取；避免直接跨模块修改对方状态。
- 路由与权限：
  - 路由 `meta.roles` 控制页面级权限；按钮级权限通过 `<Auth :value="'perm.code' | ['perm.code']">` 包裹按钮渲染。
  - 首页显隐由 `VITE_HIDE_HOME` 控制；动态路由缓存通过 `getConfig().CachingAsyncRoutes` 控制。
- HTTP 调用：
  - 统一使用 `src/utils/http` 的 `http.get/post/request`；URL 统一经 `baseUrlApi('/xxx')` 生成（自动 `/api` 前缀）。
  - 返回值一般为 `CommonResult` 或更具体类型；错误通过 Axios 拦截统一抛出。
  - 令牌处理：`utils/auth.ts` 负责 `authorized-token` 与 `user-info` 存取、无感刷新。
- 样式：
  - 全局 SCSS + Tailwind；Stylelint 标准/顺序/SCSS 配置已启用。
  - 保持类名/变量/层级符合现有风格；必要时新增变量至主题或对应 SCSS 文件。
- 日志：
  - 生产构建会移除 `console.*`（除白名单 JS）；本地调试可使用 `console`，合并前移除多余日志。

参考文件：

- eslint.config.js:1
- stylelint.config.js:1
- src/utils/http/index.ts:1
- src/api/utils.ts:1
- build/plugins.ts:1
- types/global.d.ts:1

---

## 6. 环境变量与构建参数

- `.env.*` 支持并通过 `build/utils.ts` 的 `warpperEnv` 处理到 `import.meta.env`：
  - `VITE_PORT: number`（默认 8848）
  - `VITE_PUBLIC_PATH: string`（部署二级路径或 CDN 前缀）
  - `VITE_ROUTER_HISTORY: string`（`hash` 或 `h5`，可带 base，形如 `hash,/app`）
  - `VITE_CDN: boolean`（生产是否使用 CDN 外链依赖）
  - `VITE_HIDE_HOME: 'true' | 'false'`（是否隐藏首页菜单）
  - `VITE_COMPRESSION: 'none' | 'gzip' | 'brotli' | 'both' | 'gzip-clear' | 'brotli-clear' | 'both-clear'`

- 开发代理：`/api` → `http://localhost:3000`
- Axios `baseURL` 解析规则：
  - 开发环境：使用相对路径配合 Vite 代理（`/api` → `http://localhost:3000`）。
  - 生产/预发：优先读取 `.env.*` 中的 `VITE_SERVER_URL`；若未设置，则回落到 `https://tire-api.laiczhang.com`。

参考文件：

- build/utils.ts:1
- vite.config.ts:1
- src/utils/http/index.ts:1

---

## 7. 提交与质量保障

- 提交信息：Conventional Commits（由 Commitlint 校验）
  - 类型举例：`feat`、`fix`、`refactor`、`docs`、`style`、`test`、`build`、`chore`、`ci`、`revert`、`types`、`release` 等。
- 示例：`feat(business): add provider CRUD pages`
- 预提交钩子：Husky + lint-staged
  - 针对暂存区文件执行 Prettier/ESLint/Stylelint 修复。
- 手动质量检查：
  - `pnpm typecheck`、`pnpm lint`、`pnpm svgo`（压缩 SVG）、`pnpm cloc`（代码统计）。

参考文件：

- commitlint.config.js:1
- .husky/pre-commit:1
- .lintstagedrc:1

---

## 8. 常见开发任务模板

以下流程总结了与现有代码一致的落地方式：

- 新增业务模块页面（以 `business/foo` 为例）：
  1. 视图：在 `src/views/business/foo/` 创建 `index.vue`、`form.vue`、`table.tsx`、`columns.ts(x)`；复用 `ReDialog`、`RePureTableBar` 模式（参考现有模块）。
  2. 路由：在 `src/router/modules/auth.ts` 的对应业务节点下添加：`{ name, path, component: () => import('...'), meta: { roles, title, icon, rank }, isShow }`。
  3. 接口：在 `src/api/business/foo.ts` 新增 `getFooListApi/addFooApi/getFooApi/updateFooApi/deleteFooApi` 等，统一走 `baseUrlApi`。
  4. 权限：页面级通过 `meta.roles`；按钮级通过 `<Auth :value="'perm.code'">`。
  5. 状态：如需缓存公司/用户/标签页等，复用现有 Pinia 模块与工具。

- 新增接口方法：
  1. 在 `src/api/<domain>.ts` 内，通过 `http.get/post` + `baseUrlApi()` 实现；
  2. 类型统一使用 `src/api/type.ts` 或新增合适类型；
  3. 涉及公司 ID 时，优先通过 `getCompanyId()` 获取。

- 表格列定义：
  - 使用 `columns.ts(x)`，遵循已有字段命名与格式（`label/prop/formatter/slot/fixed/minWidth` 等）。
  - 复杂渲染使用 TSX（见 `src/views/business/*/table.tsx` 使用模式）。

- 消息与弹窗：
  - 使用 `src/utils/message.ts` 的 `message()` 与 `src/components/ReDialog` 的 `addDialog()`。

- 主题与外观：
  - 运行时主题与布局：`public/platform-config.json`；
  - Element Plus 主色在运行时可通过 `useDataThemeChange().setEpThemeColor()` 动态调整；Tailwind/SCSS 按需增量修改。

参考文件：

- src/views/business/tire/table.tsx:1
- src/views/business/customer/columns.ts:1
- src/api/business/order.ts:1
- src/components/ReDialog/index.ts:1
- src/utils/message.ts:1
- src/layout/hooks/useDataThemeChange.ts:1

---

## 9. 安全与合规

- 切勿提交敏感信息（密钥、Token、个人隐私数据等）。
- 默认生产接口 `baseURL` 指向公网 `https://tire-api.laiczhang.com`；如需更换，请按环境变量或配置进行调整，不要硬编码到业务代码中。
- 严禁绕过权限控制（`meta.roles`、`<Auth>`）直接渲染受限内容。
- 前端仅做必要的校验与展示，不在浏览器端实现敏感业务逻辑。

参考文件：

- src/utils/http/index.ts:1
- src/router/utils.ts:1

---

## 10. 构建与部署

- 标准构建：`pnpm build` → `dist/`
- 压缩：通过 `VITE_COMPRESSION` 控制 gzip/brotli 及是否清理源文件。
- CDN 外链：`.env.production` 中将 `VITE_CDN=true` 可启用（仅推荐外网/CDN 场景）。
- Docker：
  - 构建：`docker build -t tire-admin-web .`
  - 运行：`docker run -p 8080:80 tire-admin-web`
  - 镜像阶段：Node 24-alpine 构建、Nginx 运行（见 Dockerfile）。
- Vercel：`vercel.json` 将所有路径重写到 `index.html`，保证 SPA 路由可刷新直达。

参考文件：

- build/compress.ts:1
- build/cdn.ts:1
- Dockerfile:1
- vercel.json:1

---

## 11. 已知注意点

- `src/store/unstorage.ts` 中封装的 unstorage 适配器方法（`setItems/getItems/setItem/getItem`）未对外返回 Promise/值（可能为后续扩展预留），请谨慎依赖返回值行为。
- 生产构建移除大部分 `console.*`，调试用日志请在提交前清理。必要时可将重要信息通过 UI Message/Notice 呈现。

参考文件：

- src/store/unstorage.ts:1
- build/plugins.ts:1

---

## 12. 贡献准则（Agents）

- 精准与最小化变更：围绕任务目标做“最小闭环”修改，不随意改动风格/文件名/目录结构。
- 保持一致性：
  - 命名、目录、接口封装、表格/弹窗调用方式与现有模式保持一致。
  - 新增类型与工具优先放在既有文件/目录中（如 `src/api/type.ts`、`src/utils/*`）。
- 文档与注释：
  - 涉及配置、环境变量、路由权限等改动，请更新本文件或 `README.md` 中相应说明。
- 不要提交：`dist/`、`node_modules/`、`.eslintcache`、报告文件等构建产物或临时文件。
- 提交前自检：`pnpm typecheck && pnpm lint && pnpm build`，确保通过。

---

如对本文件有改进建议，请在变更中明确列出目的与影响范围，并与维护者确认后再合入。
