## Introduction

This project is an inventory management application for the tire trading industry. It was developed using the Vue family (Vue 3, Vite, Pinia, VueUse), a self-encapsulated UI component library based on Element-plus, the Echarts 5 data visualization library, the Axios network request library, and TypeScript 5. The project's goal is to provide a user-friendly interface for managing product inventory and sales, as well as a login function. Features to be developed include: optimizing data visualization, Redis caching, log management, file management, push settings management, and deleting users and related data.

The project currently supports version 1.x.x; versions below 1.0 will no longer receive security updates.

### [FE](https://github.com/LaicZhang/tire-admin-web)

- Vue
- Pinia
- Typescript
- Element Plus
- Vite
- TailwindCSS

### [BE](https://github.com/LaicZhang/be-core)

- Nest.js
- Typescript
- Prisma
- Postgres
- Redis
- Docker

### code style

- ESlint
- StyleLint
- ESLint config by antfu
- husky

## deploy

- Vercel
- OSS
- Tencent Cloud
- Tencent Webify

## Environment & BaseURL

- `DEV`：HTTP `baseURL` 为空字符串，走相对路径 + Vite 代理（`/api` → 后端）
- `staging/production`：必须配置 `VITE_SERVER_URL`，构建产物会使用该值作为 HTTP `baseURL`
- 构建硬化：`staging/production` 构建默认移除 `console.*`（避免泄露敏感信息）

## Installation

```
pnpm i
// or
yarn
```

## demo

![](https://img1.tucang.cc/api/image/show/07a84b802411ad04bd8d32bfabedab6b)

## TODO

- [x] Reduce memory usage
- [x] Upgrade eslint->9.x
- [ ] Optimize deployment plan
- [ ] Back up the database regularly

## Thanks

Thanks to [jetbrains](https://jetbrains.com) for sponsoring my development tools.

## License

[MIT](./LICENSE)
