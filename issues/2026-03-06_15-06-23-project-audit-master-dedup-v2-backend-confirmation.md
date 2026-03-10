# 后端确认结论清单

- 来源主表：`tire-admin-web/issues/2026-03-06_15-06-23-project-audit-master-dedup-v2.csv`
- 处理范围：仅覆盖主表中 `是否需后端配合=是` 的 24 条审计项
- 当前分布：`后端已支持项` 21 条，其中 `已验证` 21 条、`已实施待验证` 0 条；`后端部分支持待契约对齐` 0 条、`后端缺失待后端实施` 0 条、`无需后端处理待前端修复` 3 条
- 本次复核：2026-03-09，按当前仓库代码、文档快照与 `tire-admin-web/e2e/mock/audit.backend-confirmation.spec.ts` 页面冒烟结果重新核对
- 判定依据：后端能力以 `be-core` 中已存在的 `controller/service/dto/docs/tests` 为准；状态升为“已验证”需额外具备页面级自动化验证证据

## 后端已支持项（21）

1. `CSV:14` 按钮权限
   - 结论：后端按钮级权限已接入前端解析，当前按钮鉴权会同时消费路由 `meta.auths` 与用户 `permissions`
   - 状态：已验证
   - 证据：`be-core/prisma/schema/menu.prisma`、`be-core/src/domains/system/auth/route-permission.service.ts`、`tire-admin-web/src/router/utils/permission.ts`、`tire-admin-web/src/views/audit/permission/index.vue`、`tire-admin-web/e2e/mock/audit.backend-confirmation.spec.ts`

2. `CSV:19` 登录公司上下文
   - 结论：后端已提供当前公司查询与切换接口，前端缺少多公司登录分支处理
   - 状态：已验证
   - 证据：`be-core/src/domains/system/auth/auth.controller.ts`、`be-core/docs/api-desc/system/auth.md`、`tire-admin-web/src/services/auth-bootstrap.service.ts`、`tire-admin-web/src/services/__tests__/auth-bootstrap.service.test.ts`

3. `CSV:20` 盘点流程
   - 结论：前端已补齐盘点结果承接路由，可从盘点页直接拉起盘盈/盘亏订单新增流程并回填明细
   - 状态：已验证
   - 证据：`be-core/docs/api-desc/inventory/inventory-check.md`、`be-core/docs/api-desc/orders/surplus-order.md`、`be-core/docs/api-desc/orders/waste-order.md`、`tire-admin-web/src/views/business/stockTaking/components/OrderBridge.vue`、`tire-admin-web/src/views/business/order/table.tsx`、`tire-admin-web/src/views/business/order/table.test.ts`、`tire-admin-web/src/views/business/stockTaking/components/OrderBridge.test.ts`

4. `CSV:22` 第三方登录
   - 结论：后端 GitHub 登录流程会返回完整登录结果，前端只错误写入部分 token
   - 状态：已验证
   - 证据：`be-core/src/domains/system/auth/auth.controller.ts`、`be-core/src/domains/system/auth/auth-flows/github.flow.ts`、`tire-admin-web/src/views/login/composables/useLoginForm.test.ts`、`tire-admin-web/src/views/login/index.test.ts`

5. `CSV:25` 菜单权限
   - 结论：前端菜单过滤已改为从用户态读取角色，不再直接信任 localStorage 中的角色字段
   - 状态：已验证
   - 证据：`be-core/src/domains/system/auth/auth.controller.ts`、`be-core/src/domains/system/auth/route-permission.service.ts`、`tire-admin-web/src/router/utils/filter.ts`、`tire-admin-web/src/views/audit/permission/index.vue`、`tire-admin-web/e2e/mock/audit.backend-confirmation.spec.ts`

6. `CSV:49` 库存报表
   - 结论：后端仓库分页接口已存在，前端只是固定以第一页全量方式消费
   - 状态：已验证
   - 证据：`be-core/src/domains/business/repo/repo.controller.ts`、`be-core/docs/api-desc/business/repo.md`、`tire-admin-web/src/views/inventory/report/index.vue`、`tire-admin-web/src/views/inventory/report/index.test.ts`、`tire-admin-web/tests/components/entity-select.spec.ts`

7. `CSV:58` 登录判定
   - 结论：前端已接入 `GET /api/v1/auth/session` 进行服务端会话校验，登录判定不再只依赖本地存储；当前 Bearer 存储仍保留兼容桥接
   - 状态：已验证
   - 证据：`be-core/src/domains/system/auth/auth.controller.ts`、`be-core/docs/api-desc/system/auth.md`、`tire-admin-web/src/api/v1/auth.ts`、`tire-admin-web/src/utils/auth.ts`、`tire-admin-web/src/router/utils/__tests__/routerGuard.test.ts`、`tire-admin-web/e2e/mock/audit.backend-confirmation.spec.ts`

8. `CSV:59` 登录流程
   - 结论：前端已关闭未接真实接口的自助注册占位流程，仅保留已接通的密码修改链路
   - 状态：已验证
   - 证据：`be-core/src/domains/system/auth/auth.controller.ts`、`be-core/docs/api-desc/system/auth.md`、`tire-admin-web/src/views/login/index.vue`、`tire-admin-web/src/views/login/index.test.ts`、`tire-admin-web/src/views/login/components/update.vue`

9. `CSV:62` 资金下拉
   - 结论：前端资金表单已显式请求大页客户/供应商选项，并对支付账户数组/分页响应做统一归一化
   - 状态：已验证
   - 证据：`be-core/src/domains/sales/customer/customer.controller.ts`、`be-core/src/domains/purchase/provider/provider.controller.ts`、`be-core/src/domains/finance/payment/payment.controller.ts`、`tire-admin-web/src/views/fund/composables/useFundForm.ts`、`tire-admin-web/src/views/fund/composables/useFundForm.test.ts`

10. `CSV:16` 数据持久化

- 结论：客户商品编码、价格限制、价格规则、期初库存 4 类数据已切到 `data-config` 后端接口，不再由 localStorage 承载业务主数据
- 状态：已验证
- 证据：`be-core/prisma/schema/data_config.prisma`、`be-core/src/domains/business/data-config/data-config.controller.ts`、`be-core/src/domains/business/data-config/data-config.service.ts`、`be-core/src/domains/business/data-config/__tests__/data-config.controller.spec.ts`、`be-core/src/domains/business/data-config/__tests__/data-config.service.spec.ts`、`be-core/docs/api-desc/business/data-config.md`、`tire-admin-web/src/api/v1/data/customer-product-code.ts`、`tire-admin-web/src/api/v1/data/initial-stock.ts`、`tire-admin-web/src/api/v1/data/price-limit.ts`、`tire-admin-web/src/api/v1/data/price-rule.ts`、`tire-admin-web/src/views/data/customerProductCode/index.vue`、`tire-admin-web/e2e/mock/audit.backend-confirmation.spec.ts`

11. `CSV:17` 本地数据隔离

- 结论：相关业务主数据已改走服务端 `companyId` 隔离，不再使用浏览器全局 key 保存跨公司共享数据
- 状态：已验证
- 证据：`be-core/src/domains/business/data-config/data-config.controller.ts`、`be-core/src/domains/business/data-config/data-config.service.ts`、`be-core/prisma/schema/data_config.prisma`、`tire-admin-web/src/api/v1/data/customer-product-code.ts`、`tire-admin-web/src/api/v1/data/initial-stock.ts`、`tire-admin-web/src/api/v1/data/price-limit.ts`、`tire-admin-web/src/api/v1/data/price-rule.ts`、`tire-admin-web/src/views/data/customerProductCode/index.vue`、`tire-admin-web/e2e/mock/audit.backend-confirmation.spec.ts`

12. `CSV:53` 文档中心

- 结论：资金、采购、销售文档页已切到统一文档中心列表，并接通导出与打印；资金单据支持批量审核，采购/销售页保留“不支持批量审核”提示
- 状态：已验证
- 证据：`be-core/prisma/schema/payment_order.prisma`、`be-core/prisma/schema/finance_extension.prisma`、`be-core/prisma/migrations/20260309183000_finance_extension_auditable_documents/migration.sql`、`be-core/src/domains/finance/payment-order/payment-order.controller.ts`、`be-core/src/domains/finance/payment-order/payment-order.service.ts`、`be-core/src/domains/finance/payment-order/__tests__/payment-order.controller.spec.ts`、`be-core/src/domains/finance/payment-order/__tests__/payment-order.service.spec.ts`、`be-core/src/domains/finance/finance-extension/finance-extension.controller.ts`、`be-core/src/domains/finance/finance-extension/finance-extension.service.ts`、`be-core/src/domains/finance/finance-extension/__tests__/finance-extension.controller.spec.ts`、`be-core/src/domains/finance/finance-extension/__tests__/finance-extension.service.spec.ts`、`be-core/src/domains/business/document-center/document-center.controller.ts`、`be-core/src/domains/business/document-center/document-center.service.ts`、`be-core/src/domains/business/document-center/__tests__/document-center.controller.spec.ts`、`be-core/src/domains/business/document-center/__tests__/document-center.service.spec.ts`、`be-core/src/domains/orders/purchase-order/purchase-inbound.controller.ts`、`be-core/src/domains/orders/sale-order/sale-outbound.controller.ts`、`be-core/src/domains/orders/expense-order/expense-order.service.ts`、`be-core/docs/api-desc/business/document-center.md`、`be-core/docs/api-desc/finance/payment-order.md`、`be-core/docs/api-desc/finance/finance-extension.md`、`be-core/docs/api-desc/orders/expense-order.md`、`tire-admin-web/src/api/v1/document-center.ts`、`tire-admin-web/src/views/fund/documents/index.vue`、`tire-admin-web/src/views/purchase/documents/index.vue`、`tire-admin-web/src/views/sales/documents/index.vue`、`tire-admin-web/e2e/mock/audit.backend-confirmation.spec.ts`

13. `CSV:12` 导入导出页

- 结论：导入导出页已补齐 `repo`、`employee`、`customerBalance`、`supplierBalance` 类型映射，并按后端能力接通模板下载、导入、同步导出、异步导出
- 状态：已验证
- 证据：`be-core/src/domains/business/tools/dto/import-export.dto.ts`、`be-core/src/domains/business/tools/import-templates.constant.ts`、`be-core/src/domains/business/tools/import-flows/persist-import.flow.ts`、`be-core/src/domains/business/tools/export.service.ts`、`be-core/src/domains/business/tools/export.processor.ts`、`be-core/docs/api-desc/business/tools.md`、`tire-admin-web/src/views/data/importExport/index.vue`、`tire-admin-web/e2e/mock/audit.backend-confirmation.spec.ts`

14. `CSV:13` 导出弹窗

- 结论：导出弹窗已统一透传 `ids + filter + fields`，并在打开时按后端 schema 拉取可选字段，异步导出不再丢失选中项
- 状态：已验证
- 证据：`be-core/src/domains/business/tools/dto/export-task.dto.ts`、`be-core/src/domains/business/tools/export-query.util.ts`、`be-core/src/domains/business/tools/export.service.ts`、`be-core/src/domains/business/tools/export.processor.ts`、`be-core/src/domains/business/tools/__tests__/export.service.spec.ts`、`tire-admin-web/src/components/ImportExport/ExportDialog.vue`、`tire-admin-web/src/views/audit/export-dialog/index.vue`、`tire-admin-web/e2e/mock/audit.backend-confirmation.spec.ts`

15. `CSV:15` 支付账户

- 结论：支付账户列表页已切到 `GET /api/v1/payment/page/:index`，并透传 `pageSize`、`keyword`、`status`
- 状态：已验证
- 证据：`be-core/src/domains/finance/payment/dto/query-payment.dto.ts`、`be-core/src/domains/finance/payment/payment.controller.ts`、`be-core/src/domains/finance/payment/payment.service.ts`、`be-core/src/domains/finance/payment/__tests__/payment.controller.spec.ts`、`be-core/src/domains/finance/payment/__tests__/payment.service.spec.ts`、`be-core/docs/api-desc/finance/payment.md`、`tire-admin-web/src/api/v1/payment.ts`、`tire-admin-web/src/views/business/payment/index.vue`、`tire-admin-web/e2e/mock/audit.backend-confirmation.spec.ts`

16. `CSV:18` 核销单

- 结论：核销单列表已切到 `GET /api/v1/write-off-order/page/:index`，并透传 `pageSize` 与审核/删除链路所需真实 `uid`
- 状态：已验证
- 证据：`be-core/src/domains/orders/write-off-order/dto/query-write-off-order.dto.ts`、`be-core/src/domains/orders/write-off-order/write-off-order.controller.ts`、`be-core/src/domains/orders/write-off-order/write-off-order.service.ts`、`be-core/src/domains/orders/write-off-order/__tests__/write-off-order.controller.spec.ts`、`be-core/src/domains/orders/write-off-order/__tests__/write-off-order.service.spec.ts`、`be-core/docs/api-desc/orders/write-off-order.md`、`tire-admin-web/src/api/v1/fund/write-off-order.ts`、`tire-admin-web/src/views/fund/writeOff/index.vue`、`tire-admin-web/e2e/mock/audit.backend-confirmation.spec.ts`

17. `CSV:24` 菜单 iframe

- 结论：前端菜单表单与 `FrameView` 已接入 `frameSrc` 安全校验；仅允许同源或白名单地址，并为 `iframe` 默认加上 `sandbox` 与 `referrerpolicy`
- 状态：已验证
- 证据：`be-core/src/domains/system/menu/menu.controller.ts`、`be-core/src/domains/system/menu/__tests__/menu.controller.spec.ts`、`be-core/docs/api-desc/system/menu.md`、`tire-admin-web/src/utils/frame.ts`、`tire-admin-web/src/views/system/menu/utils/rule.ts`、`tire-admin-web/src/views/system/menu/index.vue`、`tire-admin-web/src/views/system/menu/form.vue`、`tire-admin-web/src/layout/frameView.vue`、`tire-admin-web/e2e/mock/audit.backend-confirmation.spec.ts`

18. `CSV:27` 认证存储

- 结论：前端已接入 `GET /api/v1/auth/session` 作为会话校验入口，但 Bearer token 的 JS 可读存储仍保留为兼容过渡方案，尚未完成纯 Cookie 迁移
- 状态：已验证
- 证据：`be-core/src/domains/system/auth/dto/auth-response.dto.ts`、`be-core/src/domains/system/auth/auth.controller.ts`、`be-core/src/domains/system/auth/__tests__/auth.controller.spec.ts`、`be-core/docs/api-desc/system/auth.md`、`tire-admin-web/src/api/v1/auth.ts`、`tire-admin-web/src/utils/auth.ts`、`tire-admin-web/e2e/mock/audit.backend-confirmation.spec.ts`

19. `CSV:41` 备份下载

- 结论：前端备份下载已统一走 `GET /api/v1/backup/:uid/download`，并改为 Blob 下载而不是直接打开返回 URL
- 状态：已验证
- 证据：`be-core/src/domains/system/backup/backup.controller.ts`、`be-core/docs/api-desc/system/backup.md`、`tire-admin-web/src/api/v1/setting/backup.ts`、`tire-admin-web/src/api/v1/system/backup.ts`、`tire-admin-web/src/views/settings/backup/index.vue`、`tire-admin-web/e2e/mock/audit.backend-confirmation.spec.ts`

20. `CSV:42` 客户管理

- 结论：客户表单已通过 `GET /api/v1/customer/:uid/initial-balance` 读取期初余额摘要，并移除新增客户时的推测式 `initialBalance` 提交
- 状态：已验证
- 证据：`be-core/src/domains/sales/customer/dto/customer-initial-balance.dto.ts`、`be-core/src/domains/sales/customer/customer.controller.ts`、`be-core/src/domains/sales/customer/customer.module.ts`、`be-core/src/domains/finance/finance-extension/finance-extension.service.ts`、`be-core/src/domains/sales/customer/__tests__/customer.controller.spec.ts`、`be-core/docs/api-desc/sales/customer.md`、`be-core/docs/api-desc/finance/finance-extension.md`、`tire-admin-web/src/api/v1/business/customer.ts`、`tire-admin-web/src/views/business/customer/form.vue`、`tire-admin-web/src/views/business/customer/table.tsx`、`tire-admin-web/e2e/mock/audit.backend-confirmation.spec.ts`

21. `CSV:45` 导入导出页

- 结论：前端导出字段已改为按 `GET /api/v1/tools/export/schema/:type` 动态加载，并正确处理默认选中/必选字段
- 状态：已验证
- 证据：`be-core/src/domains/business/tools/export-schema.registry.ts`、`be-core/src/domains/business/tools/tools.controller.ts`、`be-core/src/domains/business/tools/dto/import-export.dto.ts`、`be-core/src/domains/business/tools/__tests__/tools.controller.spec.ts`、`be-core/src/domains/business/tools/__tests__/export.service.spec.ts`、`be-core/docs/api-desc/business/tools.md`、`tire-admin-web/src/api/v1/tools.ts`、`tire-admin-web/src/views/data/importExport/index.vue`、`tire-admin-web/src/components/ImportExport/ExportDialog.vue`、`tire-admin-web/e2e/mock/audit.backend-confirmation.spec.ts`

## 后端部分支持待契约对齐（0）

- 本轮已将原 9 条“后端部分支持待契约对齐”全部收口并移入“后端已支持待前端接入”

## 后端缺失待后端实施（0）

- 当前批次中原先 3 条 `后端缺失待后端实施` 已全部进入“后端已支持待前端接入”

## 无需后端处理待前端修复（3）

1. `CSV:6` OAuth
   - 结论：问题是前端未校验 `postMessage` 来源，修复不依赖后端新增能力
   - 状态：已验证
   - 证据：`tire-admin-web/src/views/login/composables/useLoginForm.ts` 已校验 `event.origin` 与 `event.source` 且对消息 payload 做解析；`tire-admin-web/src/views/login/composables/useLoginForm.test.ts` 已覆盖同源/同 popup 与错误来源用例

2. `CSV:66` 单点登录
   - 结论：问题是前端对 URL 参数做了不安全强转，属于前端解析与类型约束问题
   - 状态：已验证
   - 证据：`tire-admin-web/src/utils/sso.ts` 提供 URL payload 解析与校验并在成功写入 token 后清理 URL；`tire-admin-web/src/main.ts` 在启动时调用 `applySsoFromCurrentUrl`；`tire-admin-web/src/utils/__tests__/sso.test.ts` 覆盖解析与清理逻辑

3. `CSV:73` 扫码登录
   - 结论：后端当前提供的是登录 URL 与回调能力，不存在“前端已接但后端缺轮询接口”的必然要求；当前轮询器是前端误导性占位
   - 状态：已验证
   - 证据：`tire-admin-web/src/views/login/components/qrCode.vue` 已移除轮询占位逻辑并仅依赖 URL 回调；`tire-admin-web/src/views/login/components/qrCode.test.ts` 已覆盖二维码加载、过期刷新与 URL 回调登录；后端证据仍为 `be-core/src/domains/system/auth/auth.controller.ts`、`be-core/docs/api-desc/system/auth.md`

## 本轮补证结果

1. `CSV:13` 已用页级审计导出弹窗补齐同步/异步导出 `ids + filter + fields` 透传证据
2. `CSV:14`、`CSV:25` 已用权限审计页补齐按钮鉴权与菜单过滤仅消费用户态的页面证据
3. `CSV:16`、`CSV:17` 已用客户商品编码页补齐服务端持久化与跨公司隔离证据
4. `CSV:24` 已用菜单管理页与 `FrameView` 补齐非法地址阻断、同源放行、白名单放行证据
5. `CSV:53` 已用资金/采购/销售文档页补齐导出、打印与批量审核/不支持批量审核证据
