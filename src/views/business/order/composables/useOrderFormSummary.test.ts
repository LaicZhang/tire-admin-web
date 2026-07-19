import { describe, expect, it } from "vitest";
import { ref } from "vue";
import { ORDER_TYPE } from "@/utils";
import {
  applyOrderFormSummary,
  computeOrderFormSummary
} from "./useOrderFormSummary";

describe("useOrderFormSummary (UI-002)", () => {
  it("sums count and total for priced lines", () => {
    const summary = computeOrderFormSummary({
      orderType: ORDER_TYPE.sale,
      formTitle: "新增",
      details: [
        { count: 2, unitPrice: 100 },
        { count: 1, total: 50 }
      ]
    });
    expect(summary.count).toBe(3);
    expect(summary.showTotal).toBe(250);
    expect(summary.total).toBe(250);
  });

  it("applies summary onto reactive form model", () => {
    const target = ref<{ count?: number; showTotal?: number; total?: number }>(
      {}
    );
    applyOrderFormSummary({
      orderType: ORDER_TYPE.purchase,
      formTitle: "修改",
      details: [{ count: 3, unitPrice: 10 }],
      target
    });
    expect(target.value.count).toBe(3);
    expect(target.value.total).toBe(30);
  });
});
