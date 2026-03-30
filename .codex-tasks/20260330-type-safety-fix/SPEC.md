# 类型安全审计第一批修复

## Goal

一次修复 `issues/2026-03-30_22-16-02-type-safety-audit.{csv,md}` 中确认的 8 条类型安全问题，移除跨边界双重断言，补齐必要的 runtime guard，并让调用侧依赖真实接口契约。

## Deliverables

1. `useSettingsForm`、`sysParams`、`useOrderList`、`qrCode`、`finder`、`settings store`、`useCrud`、`TableOperations` 及相关调用页完成修复。
2. 新增或更新测试，覆盖 settings 抽象、扫码登录、`useCrud` 分页兼容、`getTopMenu` 空值行为、订单操作事件链路。
3. 新增一份修复后审计快照到 `issues/`，不改 `docs/audit-list/*.csv`。

## Constraints

- 仅在当前工作树 `type-safety-audit-20260330` 中修改。
- 不引入 silent fallback 或 mock success path。
- 先写/改测试并观察失败，再写生产代码。
- 保持现有业务行为不变，修复重点是类型边界与契约对齐。
