import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

describe("supplier promotion page contract", () => {
  it("manages discount, rebate and gift policies", () => {
    const source = readFileSync(
      resolve(process.cwd(), "src/views/purchase/supplierPromotion/index.vue"),
      "utf8"
    );
    expect(source).toContain("createSupplierPromotionPolicyApi");
    expect(source).toContain("updateSupplierPromotionPolicyApi");
    expect(source).toContain("deactivateSupplierPromotionPolicyApi");
    expect(source).toContain('value="DISCOUNT"');
    expect(source).toContain('value="REBATE"');
    expect(source).toContain('value="GIFT"');
  });
});
