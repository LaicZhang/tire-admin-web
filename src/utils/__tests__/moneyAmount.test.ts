import { describe, expect, it } from "vitest";
import {
  canCollectApprovedOrder,
  coerceMoneyAmount,
  isAmountLess,
  normalizeOrderListResult,
  normalizeOrderMoney,
  normalizeOrderResult,
  toMoneyNumber
} from "../moneyAmount";

describe("moneyAmount T3-ADM-002", () => {
  it("numericizes bigint strings and treats empty as zero for compares", () => {
    expect(toMoneyNumber("1000")).toBe(1000);
    expect(toMoneyNumber("900.5")).toBe(900.5);
    expect(toMoneyNumber("")).toBeNull();
    expect(toMoneyNumber("nope")).toBeNull();
    expect(coerceMoneyAmount(undefined)).toBe(0);
    expect(coerceMoneyAmount(null)).toBe(0);
    // dictionary order would hide this outstanding balance
    expect("900" < "1000").toBe(false);
    expect(isAmountLess("900", "1000")).toBe(true);
    expect(isAmountLess("1000", "900")).toBe(false);
    expect(isAmountLess(undefined, "1")).toBe(true);
  });

  it("shows collect action only for approved orders that are not fully paid", () => {
    expect(
      canCollectApprovedOrder({
        isApproved: true,
        paidAmount: "900",
        total: "1000"
      })
    ).toBe(true);
    expect(
      canCollectApprovedOrder({
        isApproved: false,
        paidAmount: "900",
        total: "1000"
      })
    ).toBe(false);
    expect(
      canCollectApprovedOrder({
        isApproved: true,
        paidAmount: "1000",
        total: "1000"
      })
    ).toBe(false);
  });

  it("normalizes order header and detail money without touching pagination total", () => {
    const order = normalizeOrderMoney({
      total: "1000",
      showTotal: "1000",
      paidAmount: "900",
      count: 2,
      details: [
        { unitPrice: "250", total: "500", discountAmount: "0", count: 2 }
      ]
    });
    expect(order).toEqual({
      total: 1000,
      showTotal: 1000,
      paidAmount: 900,
      count: 2,
      details: [{ unitPrice: 250, total: 500, discountAmount: 0, count: 2 }]
    });

    const list = normalizeOrderListResult({
      code: 200,
      msg: "ok",
      data: { list: [{ total: "10", paidAmount: "" }], total: 8 }
    });
    expect(list.data?.total).toBe(8);
    expect(list.data?.list?.[0]).toEqual({ total: 10, paidAmount: "" });

    const one = normalizeOrderResult({
      code: 200,
      msg: "ok",
      data: { total: "42", paidAmount: "1" }
    });
    expect(one.data).toEqual({ total: 42, paidAmount: 1 });
  });
});
