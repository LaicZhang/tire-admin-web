import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

describe("supplier promotion API contract", () => {
  it("uses the dedicated policy CRUD routes", () => {
    const source = readFileSync(
      resolve(process.cwd(), "src/api/purchase/supplier-promotion.ts"),
      "utf8"
    );
    expect(source).toContain('const prefix = "/supplier-promotion-policy"');
    expect(source).toContain("`${prefix}/page/${index}`");
    expect(source).toContain("baseUrlApi(`${prefix}/${uid}`)");
  });
});
