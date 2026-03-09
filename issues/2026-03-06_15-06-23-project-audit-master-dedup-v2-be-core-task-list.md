# be-core 实施任务清单

- 来源主表：`tire-admin-web/issues/2026-03-06_15-06-23-project-audit-master-dedup-v2.csv`
- 来源结论：`tire-admin-web/issues/2026-03-06_15-06-23-project-audit-master-dedup-v2-backend-confirmation.md`
- 范围：仅覆盖当前已判定为 `后端缺失待后端实施` 与 `后端部分支持待契约对齐` 的 12 条任务项
- 目标：把这 12 条拆成 `be-core` 可直接实施的任务，不包含前端改动

## P0：补齐缺失能力

### 1. 业务主数据后端化（覆盖 `CSV:16`、`CSV:17`）

**状态**

- 已实施，待前端切换接口
- 实际落地：新增 `data-config` 模块、4 张 Prisma 表、分页/创建更新/批量导入覆盖/软删除接口、配套 API 文档与单测
- 证据：`be-core/prisma/schema/data_config.prisma`、`be-core/src/domains/business/data-config/data-config.controller.ts`、`be-core/src/domains/business/data-config/data-config.service.ts`、`be-core/docs/api-desc/business/data-config.md`

**目标**

- 将前端 localStorage 中的业务主数据迁移为后端持久化能力，并按公司隔离。
- 覆盖数据类型：客户商品编码、价格限制、价格规则、期初库存。

**实施项**

- 新增独立业务数据模块，按资源拆分 4 组接口：
  - `customer-product-code`
  - `price-limit`
  - `price-rule`
  - `initial-stock`
- 每组至少提供：列表查询、单条创建/更新、批量导入/覆盖、删除。
- 所有数据强制带 `companyId` 作用域，从鉴权上下文读取，不允许前端直传跨公司范围。
- Prisma 增加对应表与索引，最少包含：`uid`、`companyId`、业务字段、`createdAt`、`updatedAt`、`deleteAt`。
- 导入导出能力与 `tools` 模块对齐，避免再次出现前端单独落本地的旁路实现。

**接口建议**

- `GET /api/data-config/customer-product-code/page/:index`
- `POST /api/data-config/customer-product-code`
- `PATCH /api/data-config/customer-product-code/:uid`
- `DELETE /api/data-config/customer-product-code/:uid`
- 其余 3 类资源沿用同一模式。

**验收标准**

- 同一浏览器切换不同用户/公司后，数据天然隔离。
- 删除 localStorage 后业务数据仍可恢复。
- 列表接口支持分页、关键字筛选、公司隔离。
- 每组资源都有 controller/service/spec 与 API 文档。

**测试要求**

- controller 权限与 companyId 隔离测试。
- service CRUD 与软删测试。
- 导入/批量覆盖场景测试。
- 跨公司越权访问拒绝测试。

**回写说明**

- `backend-confirmation` 中 `CSV:16`、`CSV:17` 已回写为 `后端已支持待前端接入`

### 2. 统一文档中心后端（覆盖 `CSV:53`）

**状态**

- 已实施，待前端切换接口
- 已落地：统一文档中心分页列表、导出 Excel、打印 DTO、批量审核入口，以及 `/purchase-inbound`、`/sale-outbound` 兼容路由、独立 `payment-order` 模块
- 当前支持：`WRITE_OFF`、`PAYMENT`、`TRANSFER`、`OTHER_INCOME`、`OTHER_EXPENSE` 已接入批量审核；`TRANSFER` 与 `OTHER_*` 已改为读取真实状态流转，历史 `expense-order` 已迁移并兼容到 `other_transaction`
- 证据：`be-core/prisma/schema/payment_order.prisma`、`be-core/prisma/schema/finance_extension.prisma`、`be-core/prisma/migrations/20260309183000_finance_extension_auditable_documents/migration.sql`、`be-core/src/domains/finance/payment-order/payment-order.controller.ts`、`be-core/src/domains/finance/payment-order/payment-order.service.ts`、`be-core/src/domains/finance/payment-order/__tests__/payment-order.controller.spec.ts`、`be-core/src/domains/finance/payment-order/__tests__/payment-order.service.spec.ts`、`be-core/src/domains/finance/finance-extension/finance-extension.controller.ts`、`be-core/src/domains/finance/finance-extension/finance-extension.service.ts`、`be-core/src/domains/finance/finance-extension/__tests__/finance-extension.controller.spec.ts`、`be-core/src/domains/finance/finance-extension/__tests__/finance-extension.service.spec.ts`、`be-core/src/domains/business/document-center/document-center.controller.ts`、`be-core/src/domains/business/document-center/document-center.service.ts`、`be-core/src/domains/orders/purchase-order/purchase-inbound.controller.ts`、`be-core/src/domains/orders/sale-order/sale-outbound.controller.ts`、`be-core/src/domains/orders/expense-order/expense-order.service.ts`、`be-core/docs/api-desc/business/document-center.md`、`be-core/docs/api-desc/finance/payment-order.md`、`be-core/docs/api-desc/finance/finance-extension.md`、`be-core/docs/api-desc/orders/expense-order.md`

**目标**

- 为资金、采购、销售文档中心提供统一聚合查询与批处理能力，替换当前前端占位实现。

**实施项**

- 新增统一文档中心模块，提供跨单据类型的聚合列表查询。
- 第一阶段支持文档类型：
  - 资金：收款、付款、核销、其他收入、其他支出、转账
  - 采购：采购单、采购入库单、采购退货单
  - 销售：销售单、销售出库单、销售退货单
- 提供批量审核接口，仅覆盖当前已有审核状态机的单据类型。
- 将 `account-transfer`、`other-transaction` 升级为可审核单据，并把历史 `expense-order` 迁移到 `other_transaction direction=OUT`。
- 提供导出接口，先输出结构化 Excel，不做前端本地拼装。
- 提供打印数据接口，返回标准打印 DTO，由前端模板渲染。

**接口建议**

- `GET /api/document-center/page/:index`
- `POST /api/document-center/approve`
- `GET /api/document-center/export`
- `GET /api/document-center/print/:documentType/:uid`

**查询参数**

- `documentType`
- `status`
- `targetId/customerId/providerId`
- `startDate`
- `endDate`
- `keyword`
- `pageSize`

**验收标准**

- 前端不再需要按页面手工并发拉取多个 order domain 再拼表。
- 批量审核失败时返回逐条结果，不允许静默部分成功。
- 导出与打印都走后端统一数据源。

**测试要求**

- 聚合列表分页与筛选测试。
- 批量审核成功/部分失败/越权测试。
- 导出与打印 DTO 结构测试。

**回写说明**

- `backend-confirmation` 中 `CSV:53` 已回写为 `后端已支持待前端接入`

## P1：补齐契约并收口行为

### 3. 导入导出类型扩展（覆盖 `CSV:12`）

**目标**

- 让 `tools` 模块支持当前前端暴露的模块类型，至少做到“前端暴露即后端可响应”。

**实施项**

- 扩展 `ImportExportType`，补齐：`repo`、`employee`、`customer-balance`、`supplier-balance`。
- 为新增类型补模板、导入、同步导出、异步导出实现。
- 不支持的类型必须返回明确业务错误码，不允许“接口存在但 silently fallback”。

**验收标准**

- 前端当前下拉中所有模块都有明确后端响应。
- 模板、导入、同步导出、异步导出能力一致。

### 4. 异步导出选中项契约（覆盖 `CSV:13`）

**目标**

- 让异步导出与同步导出共享同一筛选契约，支持 `ids + filters` 同时生效。

**实施项**

- 为异步导出 DTO 增加显式 `ids?: string[]` 字段，不再把选中项偷偷塞进 `filter` 字符串。
- `tools.controller`、`export.service`、`export.processor` 全链路透传 `ids`。
- 查询时统一规则：若传 `ids`，则结果必须同时满足 `companyId` 与 `uid in ids`，再叠加 `filters`。
- 为同步/异步导出补统一契约文档，避免两套语义分裂。

**验收标准**

- “导出选中项”在同步与异步模式下结果完全一致。
- 越权 `ids` 不可导出。

### 5. 导出字段元数据契约（覆盖 `CSV:45`）

**目标**

- 让不同导出类型有独立字段集合定义，前端不再写死一套字段。

**实施项**

- 新增导出字段元数据接口：`GET /api/tools/export/schema/:type`。
- 每种导出类型返回字段列表、标签、默认选中状态、是否必选。
- `export.service` 读取字段选择并按类型导出，不再只依赖内置固定列。

**验收标准**

- `customer/provider/stock-init/repo/employee/customer-balance/supplier-balance` 字段集合互不混淆。
- 未传字段时按默认字段导出；传字段时仅导出允许字段。

### 6. 支付账户分页契约（覆盖 `CSV:15`）

**目标**

- 为支付账户列表提供真正的分页接口，匹配前端页面的分页能力。

**实施项**

- 保留 `GET /payment/list/:companyUid` 作为轻量全量下拉接口。
- 新增分页接口：`GET /payment/page/:index?pageSize=...`。
- 支持最少字段：`keyword`、`status`、`pageSize`。
- `pageSize` 上限统一限制为 `100`。

**验收标准**

- 切页和页容量变更会真正改变返回数据。
- 下拉场景与管理页场景分别使用轻量/分页接口，不互相污染。

### 7. 核销单分页契约（覆盖 `CSV:18`）

**目标**

- 让核销单列表支持 `pageSize`，消除前端页容量切换与后端固定 20 的分裂。

**实施项**

- `QueryWriteOffOrderDto` 增加 `pageSize?: number`。
- `WriteOffOrderService.list` 改为读取并 clamp `pageSize`，默认 20，最大 100。
- API 文档补齐 `pageSize` 参数。

**验收标准**

- `pageSize` 缺省时行为保持兼容。
- `pageSize` 非法值自动回退到默认值。

### 8. 菜单 iframe 安全收口（覆盖 `CSV:24`）

**目标**

- 在后端先限制可写入的 `frameSrc`，避免前端任何一处漏校验都可写入危险 URL。

**实施项**

- 菜单 `code=1/2` 时，`frameSrc` 必须为绝对 `https://` URL。
- 显式拒绝 `javascript:`、`data:`、`file:`、空白协议与相对路径。
- 新增可配置白名单：`MENU_FRAME_ALLOWED_HOSTS`，逗号分隔 host。
- 非白名单 URL 拒绝写入；开发环境允许 `localhost`/`127.0.0.1`。
- 返回结构中补标准化后的 `frameSrc`，供前端直接使用。

**验收标准**

- 危险协议无法入库。
- 白名单外域名无法保存。
- 现有合法菜单数据迁移后仍可读取。

### 9. Cookie Auth 契约收口（覆盖 `CSV:27`）

**目标**

- 明确后端认证主路径为 Cookie Auth，减少前端继续依赖可读 token 的空间。

**实施项**

- 固化登录、刷新、登出三条链路的 Cookie Auth 行为，并补充文档示例。
- 新增 `GET /api/auth/session`，仅用于返回当前会话是否有效与最小用户摘要。
- 对需要 Cookie Auth 的环境文档明确：`access_token`、`refresh_token`、`better-auth` 会话均由 HttpOnly Cookie 承载。
- 将 CSRF 使用方式写入 auth 文档，作为前端迁移依据。

**验收标准**

- 前端可仅依赖 Cookie + `/auth/session` 判断登录态。
- 会话失效时有稳定的 401/403 语义，不需要猜测本地 token 是否还可用。

### 10. 备份下载契约统一（覆盖 `CSV:41`）

**目标**

- 收口备份下载方式，避免前端误按“URL 返回值”消费，而后端实际提供下载流。

**实施项**

- 明确保留 `GET /backup/:uid/download` 作为唯一下载接口。
- API 文档明确响应为文件流，不返回 JSON URL。
- 返回头补齐 `Content-Disposition`、`Content-Type`，兼容 Blob 下载。
- 如业务必须新开页下载，再新增 `GET /backup/:uid/download-url`，返回短时效、同域、一次性下载地址；否则不新增第二套主路径。

**验收标准**

- 文档与实现一致。
- 前端按 Blob 或标准下载链接都能明确对接，不再猜测返回格式。

### 11. 客户期初余额契约收口（覆盖 `CSV:42`）

**目标**

- 明确客户期初余额的后端归属，消除“客户接口里可能支持 initialBalance”的歧义。

**实施项**

- 固化规则：客户主档 `customer` 不直接承载 `initialBalance` 写入；期初余额统一归 `finance-extension/initial-balance`。
- 新增便捷查询接口：`GET /api/customer/:uid/initial-balance`，返回该客户当前期初余额汇总或最近记录。
- API 文档明确：创建/编辑客户时不接收 `initialBalance` 字段。

**验收标准**

- 客户主档与期初余额职责清晰。
- 前端不再靠注释猜测能否在 customer 接口上传 `initialBalance`。

### 12. 文档与测试补齐

**目标**

- 上述所有任务完成后，配套文档和测试必须同步完成，避免再次产生“前端靠猜”的契约漂移。

**实施项**

- 为新增或变更接口补 `docs/api-desc`。
- 为每个新增分页/导出/安全校验能力补 controller/service spec。
- 对兼容接口标注 deprecation 或兼容期说明。

**统一验收标准**

- 代码 reviewed。
- 方法与路由真实存在。
- 无 TODO 占位。
- 关键路径都有自动化测试。
- 文档与实现一致。

## 建议执行顺序

1. `业务主数据后端化`
2. `统一文档中心后端`
3. `导入导出类型扩展`
4. `异步导出选中项契约`
5. `导出字段元数据契约`
6. `支付账户 / 核销单分页契约`
7. `菜单 iframe 安全收口`
8. `Cookie Auth / 备份下载 / 客户期初余额契约`
9. `文档与测试补齐`
