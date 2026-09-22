import type { TableColumnRenderer } from "@pureadmin/table";
import { mount } from "@vue/test-utils";
import { defineComponent } from "vue";
import { describe, expect, it } from "vitest";
import { formatYuanAmount } from "../transformers";
import { payableColumns, receivableColumns } from "./columns";

function renderDueAmount(columns: typeof receivableColumns, dueAmount: string) {
  const column = columns.find(item => item.prop === "dueAmount");
  if (!column?.cellRenderer) {
    throw new Error("dueAmount column has no cellRenderer");
  }
  const renderer = column.cellRenderer;
  const Host = defineComponent({
    name: "AgingDueHost",
    setup() {
      return () =>
        renderer({
          row: { dueAmount },
          index: 0,
          column,
          $index: 0,
          props: {},
          attrs: {}
        } as TableColumnRenderer);
    }
  });
  return mount(Host).text();
}

describe("aging yuan display T3-ADM-003", () => {
  it('shows ¥800.00 when the aging API returns yuan string "800.00"', () => {
    expect(formatYuanAmount("800.00")).toBe("800.00");
    expect(renderDueAmount(receivableColumns, "800.00")).toBe("¥800.00");
    expect(renderDueAmount(payableColumns, "800.00")).toBe("¥800.00");
    // dividing yuan by 100 was the bug: 800.00 must not render as ¥8.00
    expect(renderDueAmount(receivableColumns, "800.00")).not.toBe("¥8.00");
  });
});
