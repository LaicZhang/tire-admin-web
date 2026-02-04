import { describe, expect, it } from "vitest";
import { formatDate } from "@/utils";
import { columns } from "../columns";
import type { TableColumnCtx } from "element-plus/es/components/table/src/table-column/defaults";

const dummyColumn = {} as unknown as TableColumnCtx<
  Record<PropertyKey, unknown>
>;

describe("business/customer/columns", () => {
  it("formats isPublic correctly", () => {
    const isPublicCol = columns.find(c => c.prop === "isPublic");
    expect(isPublicCol?.formatter?.({}, dummyColumn, true, 0)).toBe("公开");
    expect(isPublicCol?.formatter?.({}, dummyColumn, false, 0)).toBe("不公开");
  });

  it("formats deleteAt using formatDate", () => {
    const deleteAtCol = columns.find(c => c.prop === "deleteAt");
    const input = "2025-12-28T10:30:00";
    expect(deleteAtCol?.formatter?.({}, dummyColumn, input, 0)).toBe(
      formatDate(input)
    );
  });
});
