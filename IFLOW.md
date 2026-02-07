# 轮胎贸易库存管理系统 - iFlow 上下文文档

## 项目概述

这是一个面向轮胎贸易行业的库存管理应用前端项目，提供用户友好的界面来管理产品库存、销售以及登录功能。项目基于 Vue 3 生态系统构建，采用现代化的前端技术栈和开发规范。

### 核心技术栈

**前端技术：**

- **框架**：Vue 3 + TypeScript 5
- **构建工具**：Vite 7
- **状态管理**：Pinia 3
- **路由**：Vue Router 4
- **UI 组件库**：Element Plus 2.13.0（基于自封装组件库）
- **CSS 框架**：TailwindCSS 4.1.18
- **数据可视化**：ECharts 6.0.0
- **HTTP 客户端**：Axios 1.13.2
- **工具库**：@vueuse/core 14.1.0, dayjs, crypto-js, qrcode

**后端技术（参考）：**

- **框架**：Nest.js + TypeScript
- **ORM**：Prisma
- **数据库**：PostgreSQL
- **缓存**：Redis

**代码质量工具：**

- **包管理器**：pnpm 10.27.0
- **Lint**：ESLint 9.39.2（使用 @antfu/eslint-config）
- **格式化**：Prettier 3.7.4
- **样式检查**：StyleLint 16.26.1
- **Git Hooks**：Husky 9.1.7
- **提交规范**：Commitlint
- **测试**：Jest

### 项目架构

```
src/
├── api/              # API 接口层
│   ├── business/     # 业务相关
│   ├── company/      # 公司相关
│   ├── data/         # 数据相关
│   └── system/       # 系统相关
├── assets/           # 静态资源（图片、图标等）
├── components/       # 全局组件
├── composables/      # 组合式函数
├── config/           # 配置文件
├── directives/       # 自定义指令
├── hooks/            # 自定义 Hooks
├── layout/           # 布局组件
├── plugins/          # 插件配置
├── router/           # 路由配置
│   └── modules/      # 路由模块
├── store/            # Pinia 状态管理
├── style/            # 全局样式
├── types/            # TypeScript 类型定义
├── utils/            # 工具函数
└── views/            # 页面视图
```

## 构建和运行

### 环境要求

- **Node.js**：^20.19.0 || >=22.13.0 || >=24.12.0
- **pnpm**：>=10

### 安装依赖

```bash
pnpm install
```

### 开发命令

```bash
# 启动开发服务器（端口 8848）
pnpm dev
# 或
pnpm serve

# 预览构建产物
pnpm preview

# 预览构建后的产物
pnpm preview:build
```

### 构建命令

```bash
# 生产环境构建
pnpm build

# Staging 环境构建
pnpm build:staging

# 生成构建分析报告
pnpm report
```

### 测试命令

```bash
# 运行测试
pnpm test

# 监听模式运行测试
pnpm test:watch

# 生成测试覆盖率报告
pnpm test:coverage
```

### 代码质量检查

```bash
# 运行所有 lint（自动修复）
pnpm lint

# 运行所有 lint（仅检查）
pnpm lint:check

# ESLint 检查
pnpm lint:eslint        # 自动修复
pnpm lint:eslint:check  # 仅检查

# Prettier 格式化
pnpm lint:prettier        # 自动修复
pnpm lint:prettier:check  # 仅检查

# StyleLint 检查
pnpm lint:stylelint        # 自动修复
pnpm lint:stylelint:check  # 仅检查
```

### 类型检查

```bash
# TypeScript 类型检查
pnpm typecheck
```

### 其他实用命令

```bash
# 清理缓存并重新安装
pnpm clean:cache

# 统计代码行数
pnpm cloc

# 审计代码漂移
pnpm audit:drift
```

## 环境配置

### 环境变量文件

- **开发环境**：`.env.development`
- **Staging 环境**：`.env.staging`
- **生产环境**：`.env.production`
- **通用配置**：`.env`

### 关键环境变量

```bash
# 开发环境端口
VITE_PORT = 8848

# 公共路径
VITE_PUBLIC_PATH = /

# 后端服务器地址
VITE_SERVER_URL = "http://localhost:3000"

# Vite 代理目标（仅开发环境生效）
VITE_PROXY_TARGET = "http://localhost:3000"

# 是否启用 CDN
VITE_CDN = false

# 是否启用压缩
VITE_COMPRESSION = gzip
```

### API 代理配置

**开发环境**：

- 使用 Vite 代理，`/api` 请求转发到 `VITE_PROXY_TARGET`
- 如果未配置 `VITE_PROXY_TARGET`，则回落到 `VITE_SERVER_URL`
- 如果都未配置，默认使用 `http://localhost:3000`

**Staging/Production 环境**：

- 必须配置 `VITE_SERVER_URL`
- 构建产物将直接使用该值作为 HTTP `baseURL`

## 开发约定

### TypeScript 配置

- **目标版本**：ESNext
- **严格模式**：部分启用（`strict: false`，但启用 `strictNullChecks`、`noImplicitAny` 等）
- **模块系统**：ESNext
- **路径别名**：
  - `@/*` → `src/*`
  - `@build/*` → `build/*`

### 代码风格

**ESLint 规则**：

- 基于 `@antfu/eslint-config`
- 启用 TypeScript 严格类型检查（禁止 `any` 类型）
- 强制使用内联类型导入（`import type`）
- Vue 组件使用多单词命名（可选）
- HTML 标签自闭合（强制）

**Prettier 配置**：

- 单引号：否（使用双引号）
- 尾随逗号：无
- 箭头函数参数括号：单个参数时省略
- 对象括号内空格：启用

**StyleLint 配置**：

- 基于 `stylelint-config-recommended-vue`
- 使用 SCSS 语法
- 属性排序：recess-order

### Git 提交规范

使用 Commitlint 强制遵循 Conventional Commits 规范：

- `feat:` 新功能
- `fix:` 修复 bug
- `docs:` 文档更新
- `style:` 代码格式调整
- `refactor:` 重构
- `test:` 测试相关
- `chore:` 构建/工具链相关

### Git Hooks

- **pre-commit**：运行 lint 检查（通过 lint-staged）
- **commit-msg**：验证提交信息格式（通过 commitlint）

### 组件开发规范

1. **组件命名**：使用 PascalCase，推荐多单词命名
2. **Props 定义**：使用 `vue-types` 进行类型验证
3. **事件命名**：使用 kebab-case
4. **样式隔离**：使用 scoped CSS 或 CSS Modules
5. **按需导入**：通过 `unplugin-vue-components` 自动导入 Element Plus 组件

### API 接口规范

- 所有 API 请求通过 `src/api/` 目录下的模块管理
- 使用 Axios 进行 HTTP 请求
- 统一错误处理（参考 `src/api/ERROR_HANDLING.md`）
- 接口按业务模块分类（business、company、data、system）

### 状态管理规范

- 使用 Pinia 进行状态管理
- Store 按功能模块划分
- 使用 TypeScript 类型定义状态
- 支持持久化存储（通过 `responsive-storage`）

### 样式规范

- 优先使用 TailwindCSS 类
- 复杂样式使用 SCSS
- 全局样式放在 `src/style/` 目录
- 组件样式使用 scoped CSS
- 遵循 BEM 命名规范（可选）

## 构建优化

### 代码分割

- 静态资源分类打包：
  - JS 文件：`static/js/[name]-[hash].js`
  - CSS 文件：`static/css/[name]-[hash].css`
  - 其他资源：`static/[ext]/[name]-[hash].[ext]`

### 性能优化

- **开发服务器预热**：提前转换和缓存常用文件
- **依赖优化**：预构建常用依赖（配置在 `build/optimize.ts`）
- **代码压缩**：使用 `vite-plugin-compression`（gzip）
- **CDN 加速**：可选配置 `VITE_CDN` 启用 CDN 导入
- **移除 console**：生产环境自动移除 `console.*` 语句（避免泄露敏感信息）

### 构建配置

- **目标浏览器**：ES2020
- **Chunk 大小警告阈值**：800 KB
- **Source Map**：生产环境关闭

## 部署

### 支持的平台

- **Vercel**：通过 `vercel.json` 配置
- **腾讯云**：OSS 和 Webify
- **Docker**：通过 `Dockerfile` 和 `nginx.conf`

### 部署流程

1. 运行构建命令（根据环境选择）：

   ```bash
   pnpm build          # 生产环境
   pnpm build:staging  # Staging 环境
   ```

2. 将 `dist/` 目录部署到目标平台

3. 确保环境变量配置正确（特别是 `VITE_SERVER_URL`）

### Docker 部署

```bash
# 构建镜像
docker build -t tire-admin-web .

# 运行容器
docker run -p 80:80 tire-admin-web
```

## 项目特性

### 待开发功能

- ⏳ 日志管理
- ⏳ 文件管理增强
- ⏳ 推送设置管理

## 常见问题

### 依赖安装失败

确保使用 pnpm 作为包管理器：

```bash
pnpm install
```

如果遇到问题，尝试清理缓存：

```bash
pnpm clean:cache
```

### 开发服务器启动失败

检查端口是否被占用（默认 8848）：

```bash
# 修改 .env.development 中的 VITE_PORT
VITE_PORT = 3000
```

### 构建失败

1. 运行类型检查：

   ```bash
   pnpm typecheck
   ```

2. 运行 lint 检查：

   ```bash
   pnpm lint:check
   ```

3. 清理缓存并重新安装：

   ```bash
   pnpm clean:cache
   ```

### API 请求失败

检查环境变量配置：

- 开发环境：确认 `VITE_PROXY_TARGET` 或 `VITE_SERVER_URL` 配置正确
- 生产环境：必须配置 `VITE_SERVER_URL`

### 样式问题

- 确保 `tailwind.css` 在 `main.ts` 中正确导入
- Element Plus 样式通过 `unplugin-vue-components` 按需导入
- 检查 `@pureadmin/table` 样式是否正确导入

## 相关资源

- **前端仓库**：<https://github.com/LaicZhang/tire-admin-web>
- **后端仓库**：<https://github.com/LaicZhang/be-core>
- **项目主页**：<https://tire.laiczhang.com>
- **许可证**：MIT

## 注意事项

1. **版本要求**：当前支持 1.x.x 版本，低于 1.0 的版本不再接收安全更新
2. **包管理器**：项目强制使用 pnpm，通过 `preinstall` hook 检查
3. **内存配置**：开发和构建时已配置 Node.js 内存限制（4GB/8GB）
4. **安全性**：生产环境构建会自动移除 `console.*` 语句，避免泄露敏感信息
5. **提交规范**：严格遵守 Conventional Commits 规范，否则无法提交

## 开发建议

1. **使用 TypeScript**：充分利用类型系统，避免使用 `any`
2. **组件复用**：优先使用项目封装的全局组件和 Element Plus 组件
3. **性能优化**：使用 `@vueuse/core` 提供的组合式函数优化性能
4. **代码规范**：提交前运行 `pnpm lint` 确保代码质量
5. **测试覆盖**：为新功能编写单元测试，保持测试覆盖率
6. **文档更新**：重要功能更新时同步更新相关文档

## 快速开始

```bash
# 1. 克隆仓库
git clone https://github.com/LaicZhang/tire-admin-web.git
cd tire-admin-web

# 2. 安装依赖
pnpm install

# 3. 配置环境变量
cp .env.development .env.local
# 根据需要修改 .env.local 中的配置

# 4. 启动开发服务器
pnpm dev

# 5. 打开浏览器访问
# http://localhost:8848
```

---

**最后更新**：2026-01-05
**维护者**：laiczhang
**联系方式**：<laiczhang@outlook.com>
