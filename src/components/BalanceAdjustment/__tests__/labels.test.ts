import { describe, expect, it } from "vitest";
import {
  getBalanceAdjustmentSourceTypeLabel,
  getBalanceAdjustmentTypeLabel
} from "../labels";

describe("BalanceAdjustment labels", () => {
  it("maps type labels", () => {
    expect(getBalanceAdjustmentTypeLabel("WRITE_OFF_BAD_DEBT")).toBe(
      "坏账核销"
    );
    expect(getBalanceAdjustmentTypeLabel("WRITE_OFF_OFFSET")).toBe("互抵核销");
    expect(getBalanceAdjustmentTypeLabel("MANUAL_ADJUSTMENT")).toBe("手工调整");
    expect(getBalanceAdjustmentTypeLabel("REVERSAL")).toBe("撤销/红冲");
  });

  it("maps source type labels", () => {
    expect(getBalanceAdjustmentSourceTypeLabel("WRITE_OFF_ORDER")).toBe(
      "核销单"
    );
    expect(getBalanceAdjustmentSourceTypeLabel("INITIAL_BALANCE")).toBe(
      "期初余额"
    );
    expect(getBalanceAdjustmentSourceTypeLabel("MANUAL")).toBe("手工");
  });

  it("falls back to string for unknown types", () => {
    expect(getBalanceAdjustmentTypeLabel("UNKNOWN")).toBe("UNKNOWN");
    expect(getBalanceAdjustmentSourceTypeLabel("UNKNOWN")).toBe("UNKNOWN");
  });
});
