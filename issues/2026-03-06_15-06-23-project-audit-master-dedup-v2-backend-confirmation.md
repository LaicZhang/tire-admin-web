# 后端确认结论清单

- 来源主表：`tire-admin-web/issues/2026-03-06_15-06-23-project-audit-master-dedup-v2.csv`
- 处理范围：仅覆盖主表中 `是否需后端配合=是` 的 24 条审计项
- 当前分布：`后端已支持待前端接入` 9 条、`后端部分支持待契约对齐` 9 条、`后端缺失待后端实施` 3 条、`无需后端处理待前端修复` 3 条
- 判定依据：以 `be-core` 中已存在的 `controller/service/dto/docs/tests` 为准，不以注释或前端假设为准

## 后端已支持待前端接入（9）

1. `CSV:14` 按钮权限
   - 结论：后端已有按钮级权限字段与权限路由能力，前端未正确消费用户权限状态
   - 证据：`be-core/prisma/schema/menu.prisma`、`be-core/src/domains/system/auth/route-permission.service.ts`

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
   - 结论：后端已有基于用户/角色的异步路由与菜单权限计算，前端仍直接读本地角色
   - 证据：`be-core/src/domains/system/auth/auth.controller.ts`、`be-core/src/domains/system/auth/route-permission.service.ts`

6. `CSV:49` 库存报表
   - 结论：后端仓库分页接口已存在，前端只是固定以第一页全量方式消费
   - 状态：已验证
   - 证据：`be-core/src/domains/business/repo/repo.controller.ts`、`be-core/docs/api-desc/business/repo.md`、`tire-admin-web/src/views/inventory/report/index.vue`、`tire-admin-web/src/views/inventory/report/index.test.ts`、`tire-admin-web/tests/components/entity-select.spec.ts`

7. `CSV:58` 登录判定
   - 结论：后端已有 `auth/info`、刷新、登出等会话相关接口，前端登录判定仍只依赖本地存储
   - 状态：已验证
   - 证据：`be-core/src/domains/system/auth/auth.controller.ts`、`be-core/docs/api-desc/system/auth.md`、`tire-admin-web/src/router/utils/routerGuard.ts`、`tire-admin-web/src/router/utils/__tests__/routerGuard.test.ts`

8. `CSV:59` 登录流程
   - 结论：前端已关闭未接真实接口的自助注册占位流程，仅保留已接通的密码修改链路
   - 状态：已验证
   - 证据：`be-core/src/domains/system/auth/auth.controller.ts`、`be-core/docs/api-desc/system/auth.md`、`tire-admin-web/src/views/login/index.vue`、`tire-admin-web/src/views/login/index.test.ts`、`tire-admin-web/src/views/login/components/update.vue`

9. `CSV:62` 资金下拉
   - 结论：前端资金表单已显式请求大页客户/供应商选项，并对支付账户数组/分页响应做统一归一化
   - 状态：已验证
   - 证据：`be-core/src/domains/sales/customer/customer.controller.ts`、`be-core/src/domains/purchase/provider/provider.controller.ts`、`be-core/src/domains/finance/payment/payment.controller.ts`、`tire-admin-web/src/views/fund/composables/useFundForm.ts`、`tire-admin-web/src/views/fund/composables/useFundForm.test.ts`

## 后端部分支持待契约对齐（9）

1. `CSV:12` 导入导出页
   - 结论：后端已有导入导出框架，但支持类型少于前端页面暴露的模块集合
   - 证据：`be-core/src/domains/business/tools/dto/import-export.dto.ts`、`be-core/docs/api-desc/business/tools.md`

2. `CSV:13` 导出弹窗
   - 结论：前端异步导出已传 `ids`，但后端异步导出 DTO 与处理链只定义 `filter`，选中项导出契约未完全收口
   - 证据：`be-core/src/domains/business/tools/dto/export-task.dto.ts`、`be-core/src/domains/business/tools/export.service.ts`

3. `CSV:15` 支付账户
   - 结论：后端只有按公司取账户列表接口，无分页契约；前端页面却展示分页能力
   - 证据：`be-core/src/domains/finance/payment/payment.controller.ts`、`be-core/docs/api-desc/finance/payment.md`

4. `CSV:18` 核销单
   - 结论：后端核销单列表当前固定 `pageSize=20`，前端页容量切换与后端契约不一致
   - 证据：`be-core/src/domains/orders/write-off-order/query-write-off-order.dto.ts`、`be-core/src/domains/orders/write-off-order/write-off-order.service.ts`

5. `CSV:24` 菜单 iframe
   - 结论：后端菜单模型支持 `frameSrc`，但未在服务端约束 URL 安全策略；前端 iframe 也未做安全收口
   - 证据：`be-core/prisma/schema/menu.prisma`、`be-core/src/domains/system/menu/dto/create-menu.dto.ts`

6. `CSV:27` 认证存储
   - 结论：后端已具备 Cookie Auth/CSRF 能力，但前端仍混用 Cookie 与可读存储，迁移尚未收口
   - 证据：`be-core/src/domains/system/auth/auth.controller.ts`、`be-core/src/common/guard/csrf.guard.ts`

7. `CSV:41` 备份下载
   - 结论：后端已提供受控下载流接口，前端却按“后端返回 URL”模型消费，前后端下载契约不一致
   - 证据：`be-core/src/domains/system/backup/backup.controller.ts`、`tire-admin-web/src/api/system/backup.ts`

8. `CSV:42` 客户管理
   - 结论：后端已有客户余额历史与期初余额相关能力，但并非前端注释暗示的直连字段契约，需要收口模型
   - 证据：`be-core/src/domains/sales/customer/customer.controller.ts`、`be-core/src/domains/finance/finance-extension/finance-extension.controller.ts`

9. `CSV:45` 导入导出页
   - 结论：后端导出字段按类型生成，前端固定字段集合与后端多模块能力不匹配
   - 证据：`be-core/src/domains/business/tools/export.service.ts`、`be-core/src/domains/business/tools/export.processor.ts`

## 后端缺失待后端实施（3）

1. `CSV:16` 数据持久化
   - 结论：客户商品编码、价格限制、价格规则等业务数据当前无对应后端 API，前端仍落在 localStorage
   - 证据：`be-core/src` 与 `be-core/docs/api-desc` 未见对应 domain/controller

2. `CSV:17` 本地数据隔离
   - 结论：根因仍是这些业务数据尚未后端化；在后端缺失前，前端很难真正实现跨用户/公司隔离
   - 证据：同 `CSV:16`

3. `CSV:53` 文档中心
   - 结论：前端页面中的打印/导出/批量审核仍是占位，未找到统一文档中心或相应批处理后端接口
   - 证据：`be-core/src`、`be-core/docs/api-desc` 未见 `fund/documents` 或统一 documents controller

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

## 建议跟进顺序

1. 先处理 `后端缺失待后端实施`
   - 数据持久化
   - 本地数据隔离
   - 文档中心

2. 再处理 `后端部分支持待契约对齐`
   - 导入导出类型与字段契约
   - 异步导出 `ids` 契约
   - 支付账户/核销单分页契约
   - Cookie Auth / 备份下载 / iframe 安全收口

3. 最后批量修 `后端已支持待前端接入`
   - 登录与公司上下文
   - 菜单/按钮权限消费
   - 第三方登录与库存报表等前端接线项
