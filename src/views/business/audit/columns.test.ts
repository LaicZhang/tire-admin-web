import { describe, expect, it } from "vitest";
import { columns } from "./columns";

describe("audit columns", () => {
  it("prefers subjectName for related subject display", () => {
    const subjectColumn = columns.find(column => column.label === "关联对象");

    expect(subjectColumn).toBeDefined();
    expect(
      subjectColumn?.cellRenderer?.({
        row: {
          subjectName: "仓库 A -> 仓库 B",
          customerName: "客户 A",
          providerName: "供应商 A"
        }
      } as never)
    ).toBe("仓库 A -> 仓库 B");
  });

  it("renders dash for missing total amount", () => {
    const amountColumn = columns.find(column => column.label === "金额");

    expect(amountColumn).toBeDefined();
    expect(
      amountColumn?.cellRenderer?.({
        row: {
          totalAmount: undefined
        }
      } as never)
    ).toBe("-");
  });
});
