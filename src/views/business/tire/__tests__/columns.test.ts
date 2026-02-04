import { describe, expect, it } from "vitest";
import { columns } from "../columns";

describe("business/tire/columns", () => {
  it("contains covers slot column", () => {
    const coversCol = columns.find(c => c.prop === "covers");
    expect(coversCol?.slot).toBe("covers");
  });

  it("contains operation column fixed right", () => {
    const opCol = columns.find(c => c.prop === "operation");
    expect(opCol?.fixed).toBe("right");
    expect(opCol?.slot).toBe("operation");
  });
});
