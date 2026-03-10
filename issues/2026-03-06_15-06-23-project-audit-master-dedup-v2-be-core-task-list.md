# be-core 后端实施总表

- 来源主表：`tire-admin-web/issues/2026-03-06_15-06-23-project-audit-master-dedup-v2.csv`
- 来源结论：`tire-admin-web/issues/2026-03-06_15-06-23-project-audit-master-dedup-v2-backend-confirmation.md`
- 覆盖范围：全部 12 条需要后端参与的任务项
- 文档目标：为后续 `be-core` 实现提供可直接照做的实施说明，不包含前端实现细节
- 当前分布：已落地并完成前端接线 12 条，仍待后端实施/契约对齐 0 条

## 1. 实施前置信度评估

- 置信度：94%
- 重复建设检查：`CSV:16`、`CSV:17`、`CSV:53` 已在 `be-core` 落地，本次文档保留复用说明，不再重新设计替代方案
- 架构一致性检查：新增能力继续沿用仓库既有 `controller + service + dto + docs/api-desc + __tests__` 结构，不引入新框架
- 官方与现有模式核验：接口描述、DTO 校验、分页写法、权限装饰器、Prisma 查询方式以当前仓库已存在模块模式为准
- OSS/第三方依赖检查：默认不新增第三方库，优先复用 `NestJS`、`Prisma`、`Bull`、现有公共工具与异常体系
- 根因识别：
  - 前端暴露的能力与后端枚举/DTO/接口覆盖不一致
  - 同类能力在同步/异步、下拉/分页、Cookie/Token 两套契约之间分裂
  - 历史页面依赖注释猜测接口能力，缺少明确的服务端元数据和职责边界

## 2. 文档使用约定

- 每个任务项都包含：`状态`、`当前差距`、`实施目标`、`接口/类型契约`、`实现要点`、`测试要求`、`DoD`
- 已落地项用于说明复用边界和剩余动作，不再作为待开发 backlog
- 未落地项必须写到实现者无需再做接口决策的程度
- 所有新增或变更接口都需要同步补 `docs/api-desc`

## 3. 已落地能力复用说明

### 3.1 业务主数据后端化（覆盖 `CSV:16`、`CSV:17`）

**状态**

- 已验证；`tire-admin-web/e2e/mock/audit.backend-confirmation.spec.ts` 已覆盖客户商品编码页新增、刷新与跨公司隔离

**当前差距**

- 后端能力与前端接线已完成，页面级验证证据已补齐
- 后续实现禁止再新增第二套本地持久化方案

**实施目标**

- 复用现有 `data-config` 模块作为唯一服务端数据源
- 让后续相关需求直接扩展现有 4 类资源，而不是新开散落接口

**接口/类型契约**

- 已有资源：
  - `customer-product-code`
  - `price-limit`
  - `price-rule`
  - `initial-stock`
- 已有能力：
  - 分页查询
  - 创建/更新
  - 批量导入/覆盖
  - 软删除
- 公司隔离：统一从鉴权上下文读取 `companyId`

**实现要点**

- 后续如新增字段，只允许扩展现有 Prisma 表与 DTO
- 导入导出能力继续挂在现有 `tools` 或 `data-config` 配套链路，不允许前端本地兜底
- 任意新增查询都必须保留 `companyId + deleteAt=null` 基线条件

**测试要求**

- 保持现有 controller/service spec 通过
- 新增字段时补充 CRUD、软删、批量覆盖和跨公司越权测试

**DoD**

- 代码 reviewed
- 方法与路由真实存在
- 无待办占位
- 文档与实现一致

### 3.2 统一文档中心后端（覆盖 `CSV:53`）

**状态**

- 已验证；`tire-admin-web/e2e/mock/audit.backend-confirmation.spec.ts` 已覆盖资金/采购/销售文档页导出、打印与批量审核行为

**当前差距**

- 后端聚合、导出、打印、批量审核链路已完成页面级回归
- 后续新增文档类型仍需沿用当前聚合契约

**实施目标**

- 后续所有“文档中心”相关需求优先复用现有 `document-center` 聚合模块
- 新单据类型接入时沿用当前聚合、导出、打印、批量审核模型

**接口/类型契约**

- 已有接口：
  - `GET /api/v1/document-center/page/:index`
  - `POST /api/v1/document-center/approve`
  - `GET /api/v1/document-center/export`
  - `GET /api/v1/document-center/print/:documentType/:uid`
- 已有接入类型：
  - `WRITE_OFF`
  - `PAYMENT`
  - `TRANSFER`
  - `OTHER_INCOME`
  - `OTHER_EXPENSE`
  - 采购/销售相关兼容路由

**实现要点**

- 后续新增文档类型时先判断是否应并入统一文档中心，而不是新开独立聚合页
- 审核类文档必须复用既有状态流转与批量审核入口
- 历史 `expense-order` 兼容逻辑不得回退

**测试要求**

- 保持聚合列表、批量审核、导出、打印现有测试通过
- 新增文档类型时补接入测试和导出 DTO 结构测试

**DoD**

- 代码 reviewed
- 方法与路由真实存在
- 无待办占位
- 文档与实现一致

### 3.3 已落地能力的统一约束

**状态**

- 已实施，作为后续需求边界

**当前差距**

- 历史任务文档容易把“已落地能力”再次当成待做事项

**实施目标**

- 在后续实施中明确：
  - `CSV:16`
  - `CSV:17`
  - `CSV:53`
    仅允许扩展，不允许重做

**实现要点**

- 如有新增需求，优先在原模块补字段、补过滤条件、补文档、补测试
- 若必须新增模块，需要在任务说明里先证明不能复用现有实现

**测试要求**

- 任意扩展都要覆盖回归测试，避免破坏现有前端待接线能力

**DoD**

- 不重复建设
- 无与现有模块冲突的新接口族

## 4. 本次已实施并完成契约对齐（12）

- 完成时间：2026-03-09
- 结论：`CSV:12`、`CSV:13`、`CSV:15`、`CSV:16`、`CSV:17`、`CSV:18`、`CSV:24`、`CSV:27`、`CSV:41`、`CSV:42`、`CSV:45`、`CSV:53` 已完成页面级 mock 冒烟验证

### 4.1 导入导出类型扩展（覆盖 `CSV:12`）

**状态**

- 已验证；`tire-admin-web/e2e/mock/audit.backend-confirmation.spec.ts` 已覆盖新增类型可见、模板下载、导入与同步导出

**当前差距**

- `ImportExportType` 仅覆盖 `tire/customer/provider/stock-init/order/report`
- 前端暴露的 `repo`、`employee`、`customer-balance`、`supplier-balance` 尚无完整后端响应

**实施目标**

- 让前端当前展示的每个导入导出类型都有真实后端实现

**接口/类型契约**

- 扩展 `ImportExportType`：
  - `repo`
  - `employee`
  - `customer-balance`
  - `supplier-balance`
- 同步覆盖四类链路：
  - 模板下载
  - 导入
  - 同步导出
  - 异步导出

**实现要点**

- `ImportService`、`ExportService`、`ExportProcessor`、`ToolsController` 同步扩展
- 不支持的类型必须返回明确业务异常，不能静默 fallback 到默认导出
- 数据源复用现有仓库、员工、余额历史或期初余额相关模块，不重复组装同类查询

**测试要求**

- 每个新增类型至少补一条模板、导入、同步导出、异步导出用例
- 非法类型返回固定错误

**DoD**

- 枚举、DTO、controller、service、processor、API 文档全部补齐
- 新类型都有自动化测试

### 4.2 异步导出选中项契约（覆盖 `CSV:13`）

**状态**

- 已验证；`tire-admin-web/e2e/mock/audit.backend-confirmation.spec.ts` 已覆盖页级导出弹窗同步/异步导出参数透传

**当前差距**

- 同步导出可按筛选条件导出
- 异步导出任务 DTO 只有 `filter`，没有显式 `ids`

**实施目标**

- 同步导出和异步导出共用同一筛选语义，支持“筛选结果 + 手选行”

**接口/类型契约**

- `CreateExportTaskDto` 新增 `ids?: string[]`
- 异步任务入队 payload 同步新增 `ids`
- 查询规则：先强制 `companyId`，再叠加 `ids`，再叠加 `filter`

**实现要点**

- `ids` 仅接受当前公司可访问的 `uid`
- 若 `ids` 为空数组，按未传处理
- 若 `ids` 与 `filter` 同时存在，结果取交集
- 同步导出也应复用同一过滤构造逻辑，避免双份实现

**测试要求**

- 仅传 `filter`
- 仅传 `ids`
- 同时传 `ids + filter`
- 传跨公司 `ids`
- 传非法 JSON `filter`

**DoD**

- DTO、service、processor、任务状态接口文档一致
- 同步/异步导出结果语义一致

### 4.3 导出字段元数据契约（覆盖 `CSV:45`）

**状态**

- 已验证；`tire-admin-web/e2e/mock/audit.backend-confirmation.spec.ts` 已覆盖 schema 拉取与字段驱动导出

**当前差距**

- 当前导出列头写死在 service/processor 中
- 前端无法从后端拿到“该类型允许导出哪些字段”的元数据

**实施目标**

- 后端成为导出字段的唯一元数据来源

**接口/类型契约**

- 新增接口：`GET /api/v1/tools/export/schema/:type`
- 返回结构至少包含：
  - `type`
  - `fields`
  - `fields[].key`
  - `fields[].label`
  - `fields[].defaultSelected`
  - `fields[].required`
- 导出接口新增可选 `fields?: string[]`

**实现要点**

- 每个导出类型维护独立 schema 定义，不共享一套固定字段
- `required=true` 的字段即使前端未传也必须输出
- 传入未知字段时直接拒绝，不静默忽略
- 列头文案从 schema 生成，避免 service 和文档各写一份

**测试要求**

- 每个类型返回的 schema 不混淆
- 默认字段导出
- 自定义字段导出
- 未授权字段或未知字段拒绝

**DoD**

- schema 接口、导出逻辑、API 文档统一
- 前端无需硬编码字段集合

### 4.4 支付账户分页契约（覆盖 `CSV:15`）

**状态**

- 已验证；`tire-admin-web/e2e/mock/audit.backend-confirmation.spec.ts` 已覆盖 `GET /api/v1/payment/page/:index?pageSize=10`

**当前差距**

- 当前只有 `GET /payment/list/:companyUid` 全量接口
- 管理页需要分页、关键字过滤、状态过滤

**实施目标**

- 下拉场景与管理页场景分离，避免全量接口被误用为管理页数据源

**接口/类型契约**

- 保留：`GET /payment/list/:companyUid`
- 新增：`GET /payment/page/:index`
- Query 参数：
  - `pageSize?: number`
  - `keyword?: string`
  - `status?: boolean`

**实现要点**

- `pageSize` 默认 20，最大 100
- `keyword` 匹配账户名称、开户行、备注等现有可搜索字段，保持与仓库其他分页接口一致
- `companyId` 仍从鉴权上下文读取，不从 query/path 绕过
- 返回结构复用仓库现有分页响应形态

**测试要求**

- 翻页
- 页容量变化
- 关键字过滤
- 状态过滤
- 越权公司访问拒绝

**DoD**

- 全量接口与分页接口职责清晰
- 文档明确前者用于下拉，后者用于管理页

### 4.5 核销单分页契约（覆盖 `CSV:18`）

**状态**

- 已验证；`tire-admin-web/e2e/mock/audit.backend-confirmation.spec.ts` 已覆盖分页请求与真实 `uid` 审核链路

**当前差距**

- `WriteOffOrderService.list` 仍固定 `pageSize = 20`
- DTO 无 `pageSize` 参数

**实施目标**

- 让核销单列表与前端页容量切换能力对齐

**接口/类型契约**

- `QueryWriteOffOrderDto` 新增 `pageSize?: number`
- `GET /api/v1/write-off-order/page/:index` 保持原路径不变，仅扩展 query

**实现要点**

- 默认 20，最大 100
- 非法值回退到默认值，不抛额外 500
- 查询条件与现有 `type/customerId/providerId/isApproved` 组合逻辑保持不变

**测试要求**

- 默认页容量
- 自定义页容量
- 过大页容量 clamp
- 非法页容量回退

**DoD**

- DTO、service、文档一致
- 兼容旧前端不传 `pageSize` 的行为

### 4.6 菜单 iframe 安全收口（覆盖 `CSV:24`）

**状态**

- 已验证；`tire-admin-web/e2e/mock/audit.backend-confirmation.spec.ts` 已覆盖菜单页非法地址阻断与 `FrameView` 同源/白名单放行

**当前差距**

- `frameSrc` 目前只是普通字符串字段
- 服务端未限制协议、host 白名单和开发例外

**实施目标**

- 把 URL 安全校验前置到后端保存链路

**接口/类型契约**

- 环境变量：`MENU_FRAME_ALLOWED_HOSTS`
- `code=1/2` 时：
  - 仅允许绝对 URL
  - 生产仅允许 `https://`
  - 开发允许 `http://localhost`、`http://127.0.0.1`

**实现要点**

- 在 `create-menu`、`update-menu` 两条写路径统一校验
- 显式拒绝：
  - `javascript:`
  - `data:`
  - `file:`
  - 相对路径
  - 空白协议
- 返回值使用标准化后的 URL 字符串

**测试要求**

- 合法白名单 URL
- 非白名单 URL
- 危险协议
- 开发环境 localhost 例外
- 非 iframe/external 菜单不强制 `frameSrc`

**DoD**

- 任意危险 URL 无法入库
- 文档写清白名单与环境差异

### 4.7 Cookie Auth 契约收口（覆盖 `CSV:27`）

**状态**

- 已验证；`tire-admin-web/e2e/mock/audit.backend-confirmation.spec.ts` 已覆盖 `auth/session` 通过与失效重定向

**当前差距**

- 登录、刷新、登出已有 Cookie/CSRF 基础
- 缺少单独 `auth/session` 接口说明和最小会话摘要输出

**实施目标**

- 让前端能够只依赖 Cookie + 会话摘要接口判断登录态

**接口/类型契约**

- 新增：`GET /api/v1/auth/session`
- 响应最小字段：
  - `authenticated`
  - `user.uid`
  - `user.username`
  - `user.currentCompanyId`
- 未登录时返回 401 或明确未登录语义，保持与现有鉴权体系一致

**实现要点**

- 不返回新的可读 token
- 文档明确：
  - `access_token`
  - `refresh_token`
  - `better-auth.session_token`
    使用 HttpOnly Cookie
- 同步补 CSRF 使用说明和前端调用前提

**测试要求**

- 已登录会话
- 会话失效
- 缺少 Cookie
- 仅有部分 Cookie

**DoD**

- `/auth/session` 文档、实现、测试齐全
- 不引入新的本地存储依赖

### 4.8 备份下载契约统一（覆盖 `CSV:41`）

**状态**

- 已验证；`tire-admin-web/e2e/mock/audit.backend-confirmation.spec.ts` 已覆盖 `GET /api/v1/backup/:uid/download` 下载

**当前差距**

- 后端下载路由是 `GET /backup/:uid/download`
- 前端当前调用 `/backup/download/:uid`

**实施目标**

- 备份下载只保留一条标准主路径，文档与实现完全一致

**接口/类型契约**

- 标准下载接口：`GET /backup/:uid/download`
- 响应：文件流
- 关键响应头：
  - `Content-Type: application/octet-stream`
  - `Content-Disposition: attachment; filename=...`

**实现要点**

- 不新增第二主路径
- 若未来必须支持短时效链接，单开补充接口并单独立项；本次不预埋
- API 文档直接写明 Blob/浏览器下载用法，不写“返回 URL”

**测试要求**

- 下载成功返回流
- 响应头正确
- 非法 `uid`
- 无权限下载

**DoD**

- 路由、文档、前端对接说明一致指向同一路径

### 4.9 客户期初余额契约收口（覆盖 `CSV:42`）

**状态**

- 已验证；`tire-admin-web/e2e/mock/audit.backend-confirmation.spec.ts` 已覆盖摘要读取与新增不提交 `initialBalance`

**当前差距**

- `finance-extension/initial-balance` 已存在
- `customer` 主档没有直接的期初余额便捷查询契约

**实施目标**

- 明确客户主档和期初余额的职责边界

**接口/类型契约**

- 固化规则：`customer` 创建/编辑不接收 `initialBalance`
- 新增：`GET /api/v1/customer/:uid/initial-balance`
- 返回当前客户的期初余额汇总或最近有效记录，二选一并在实现时固定；默认采用“最近有效记录 + 汇总值”同包返回

**实现要点**

- 数据源复用 `finance-extension`，不在 `customer` 表冗余存储
- 查询必须校验客户和期初余额记录同属当前公司
- 文档写清：
  - 不能在 customer DTO 写入 `initialBalance`
  - 期初余额统一走 `finance-extension`

**测试要求**

- 已存在期初余额
- 无期初余额
- 跨公司客户查询
- 已删除或无效客户

**DoD**

- 客户主档与期初余额职责清晰
- 前端无需再猜测 customer 接口是否支持该字段

## 5. 公共实现约束

### 5.1 统一类型与响应约束

- 分页接口默认 `pageSize=20`，最大 `100`
- 所有新接口保持现有响应包裹结构，不新造响应格式
- 所有跨公司数据必须从鉴权上下文读取 `companyId`
- 所有新增 DTO 使用 `class-validator`，非法输入返回业务可识别错误

### 5.2 统一测试约束

- 每个任务至少补 controller 或 service 层自动化测试
- 关键契约项必须有异常路径测试
- 修改已有行为的任务必须补兼容回归测试

### 5.3 统一文档约束

- 新增或变更接口必须同步补 `docs/api-desc`
- 若接口是兼容扩展，文档要写清默认值和兼容行为
- 任何路径变更都要在文档中显式标出唯一标准路径

## 6. 本次执行结果

1. `CSV:12`、`CSV:13`、`CSV:15`、`CSV:16`、`CSV:17`、`CSV:18`、`CSV:24`、`CSV:27`、`CSV:41`、`CSV:42`、`CSV:45`、`CSV:53` 已补页面级 mock 冒烟，并回写为 `已验证`
2. 已同步回写 `backend-confirmation.md`、`be-core-task-list.md` 与主 CSV 状态

## 7. 统一 DoD

- 代码 reviewed
- 方法与路由真实存在
- 无待办占位
- 文档与实现一致
- 关键路径都有自动化测试
- 不重复建设已落地模块
