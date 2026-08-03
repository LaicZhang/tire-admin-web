import { describe, expect, it } from "vitest";
import { hideOnMobile, columnPriorityHide } from "../viewport";
import { salesOrderColumns } from "@/views/sales/order/columns";

describe("column hide strategy", () => {
  it("exposes hideOnMobile helper", () => {
    expect(typeof hideOnMobile()).toBe("boolean");
  });

  it("sales order secondary columns use hideOnMobile", () => {
    const withHide = salesOrderColumns.filter(
      col => typeof (col as { hide?: unknown }).hide === "function"
    );
    expect(withHide.length).toBeGreaterThan(0);
    // primary number / customer / total should not hide
    const primary = salesOrderColumns.filter(col =>
      ["单据编号", "客户", "应收金额", "操作"].includes(
        String((col as { label?: string }).label ?? "")
      )
    );
    for (const col of primary) {
      expect((col as { hide?: unknown }).hide).toBeUndefined();
    }
  });

  it("columnPriorityHide tertiary hides on tablet band", () => {
    expect(columnPriorityHide("tertiary", 800)).toBe(true);
    expect(columnPriorityHide("secondary", 800)).toBe(false);
  });
});
