import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

describe("special-price API contract", () => {
  it("uses the dedicated request, approval and rejection routes", () => {
    const source = readFileSync(
      resolve(process.cwd(), "src/api/business/special-price.ts"),
      "utf8"
    );
    expect(source).toContain('const prefix = "/special-price-request"');
    expect(source).toContain("`${prefix}/page/${index}`");
    expect(source).toContain("`${prefix}/${uid}/approve`");
    expect(source).toContain("`${prefix}/${uid}/reject`");
  });
});
