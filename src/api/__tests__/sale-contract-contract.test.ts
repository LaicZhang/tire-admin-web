import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

describe("sale-contract API contract", () => {
  it("uses sale-contract routes for lifecycle actions", () => {
    const source = readFileSync(
      resolve(process.cwd(), "src/api/business/sale-contract.ts"),
      "utf8"
    );
    expect(source).toContain('const prefix = "/sale-contract"');
    expect(source).toContain("`${prefix}/page/${index}`");
    expect(source).toContain("`${prefix}/${uid}/submit`");
    expect(source).toContain("`${prefix}/${uid}/approve`");
    expect(source).toContain("`${prefix}/${uid}/reject`");
    expect(source).toContain("`${prefix}/${uid}/terminate`");
    expect(source).toContain("`${prefix}/${uid}/convert-order`");
  });
});
