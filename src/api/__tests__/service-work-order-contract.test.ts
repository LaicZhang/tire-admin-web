import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

describe("service-work-order API contract", () => {
  it("exposes retail POS closed-loop routes", () => {
    const source = readFileSync(
      resolve(process.cwd(), "src/api/business/service-work-order.ts"),
      "utf8"
    );
    expect(source).toContain('const prefix = "/service-work-order"');
    expect(source).toContain("`${prefix}/page/${index}`");
    expect(source).toContain("`${prefix}/${uid}/lines`");
    expect(source).toContain("`${prefix}/${uid}/add-package`");
    expect(source).toContain("`${prefix}/${uid}/generate-sale-order`");
    expect(source).toContain("`${prefix}/${uid}/checkout`");
    expect(source).toContain("`${prefix}/${uid}/convert`");
    expect(source).toContain("generateSaleOrderFromWorkOrderApi");
    expect(source).toContain("checkoutServiceWorkOrderApi");
  });
});
