import type {
  BalanceAdjustmentSourceType,
  BalanceAdjustmentType
} from "@/api/business/balanceAdjustment";

export function getBalanceAdjustmentTypeLabel(
  type: BalanceAdjustmentType | string
) {
  switch (type) {
    case "WRITE_OFF_BAD_DEBT":
      return "坏账核销";
    case "WRITE_OFF_OFFSET":
      return "互抵核销";
    case "INITIAL_BALANCE":
      return "期初余额";
    case "MANUAL_ADJUSTMENT":
      return "手工调整";
    case "REVERSAL":
      return "撤销/红冲";
    default:
      return String(type || "-");
  }
}

export function getBalanceAdjustmentSourceTypeLabel(
  type: BalanceAdjustmentSourceType | string
) {
  switch (type) {
    case "WRITE_OFF_ORDER":
      return "核销单";
    case "INITIAL_BALANCE":
      return "期初余额";
    case "MANUAL":
      return "手工";
    default:
      return String(type || "-");
  }
}
