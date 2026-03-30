# 类型安全专项审计（修复后快照）

- 项目：`tire-admin-web`
- 审计时间：`2026-03-30 23:14:04`（Asia/Singapore）
- 产物：本文件 + `issues/2026-03-30_23-14-04-type-safety-audit.csv`
- 关联任务：`.codex-tasks/20260330-type-safety-fix/`

## 结论摘要

本轮前一版快照中的 **8 条类型安全问题已完成修复并通过验证**：

- `P1`：4 条已修复
- `P2`：4 条已修复

本次快照关注“修复后的真实状态”，不回写 `docs/audit-list/*.csv`，旧快照保留用于比对。

## 验证证据

已执行：

- `pnpm exec vitest run tests/hooks/useCrud.spec.ts src/views/login/components/qrCode.test.ts src/services/__tests__/auth-bootstrap.service.test.ts src/router/utils/__tests__/finder.test.ts --reporter=verbose`
- `pnpm typecheck`
- `pnpm lint:eslint:check`

结果：

- 定向 Vitest：`4` 个文件、`28/28` 用例通过
- `pnpm typecheck`：通过
- `pnpm lint:eslint:check`：通过，无 error；保留仓库既有 `13` 条 `@typescript-eslint/no-non-null-assertion` warning，均不在本轮修复范围

## 修复清单

| 优先级 | 状态   | 问题类型                            | 文件                                                                                                                                                       |
| ------ | ------ | ----------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| P1     | 已修复 | `GENERIC_CONTRACT_FIXED`            | `src/composables/useSettingsForm.ts`                                                                                                                       |
| P1     | 已修复 | `API_SHAPE_DRIFT_FIXED`             | `src/views/settings/sysParams/index.vue`                                                                                                                   |
| P1     | 已修复 | `API_MODEL_REBRANDING_FIXED`        | `src/views/business/order/composables/useOrderList.ts`                                                                                                     |
| P1     | 已修复 | `UNSAFE_AUTH_PAYLOAD_CAST_FIXED`    | `src/views/login/components/qrCode.vue`                                                                                                                    |
| P2     | 已修复 | `ROUTE_MENU_DOUBLE_ASSERTION_FIXED` | `src/router/utils/finder.ts`                                                                                                                               |
| P2     | 已修复 | `UNKNOWN_STATE_WRITE_FIXED`         | `src/store/modules/settings.ts`                                                                                                                            |
| P2     | 已修复 | `PAGINATION_CONTRACT_FIXED`         | `src/composables/useCrud.ts`、`src/views/system/user/index.vue`、`src/views/business/stock/serialNumber/index.vue`、`src/views/data/batchSerial/index.vue` |
| P2     | 已修复 | `UNTYPED_EVENT_PAYLOAD_CAST_FIXED`  | `src/views/purchase/order/index.vue`、`src/views/purchase/return/index.vue`、`src/views/purchase/inbound/index.vue`、`src/views/sales/order/index.vue`     |

## 关键修复说明

### 1. 设置抽象恢复到“泛型 + 明确 shape 边界”

`useSettingsForm` 不再靠双重断言假定所有 `LoadItem` 都天然兼容 `CompanySettingItem`。默认加载路径现在只消费通过 `SettingsKeyValueItem` 守卫的条目；如果调用方接入不同 shape，必须显式提供 `transformLoad`。

### 2. 认证边界新增 payload guard

扫码登录回调先通过 `normalizeSetTokenPayload` 收敛并校验 payload，再进入 `completeLogin`。这把后端灰度响应、字段缺失或错误类型的问题前移到了边界层。

### 3. 菜单空值和订单事件边界恢复可见

`getTopMenu()` 现在返回 `menuType | null`，空菜单不再伪装成完整对象；4 个订单页则移除了模板中的 `$event as unknown as ...`，改为脚本侧 typed handlers 和 `CustomAction<XxxOrder>[]`。

### 4. 分页与 DTO 映射改为显式兼容

`useCrud` 显式兼容 `count`/`total`，用户/序列号/批次页面直接消费真实后端契约；销售报价列表通过专用映射函数转换为订单行，消除了跨领域 DTO 直接重命名。

## 备注

本快照只反映本轮 8 条已确认问题的修复状态。仓库内仍存在若干历史 warning 和其他未纳入本轮范围的类型压制点，但它们不影响本次审计结论。
