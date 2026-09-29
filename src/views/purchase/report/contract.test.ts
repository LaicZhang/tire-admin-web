import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

describe("purchase report data contract", () => {
  it("does not stop after the first short page when the backend reports more rows", () => {
    const source = readFileSync(resolve(__dirname, "index.vue"), "utf8");

    expect(source).toContain("if (total > 0 && orders.length >= total) break;");
    expect(source).toContain("if (list.length === 0) break;");
    expect(source).not.toContain("if (list.length < pageSize) break;");
  });
});
