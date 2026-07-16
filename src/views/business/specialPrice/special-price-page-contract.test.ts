import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

describe("special-price management page contract", () => {
  it("supports request creation, approval and rejection", () => {
    const source = readFileSync(
      resolve(process.cwd(), "src/views/business/specialPrice/index.vue"),
      "utf8"
    );
    expect(source).toContain("createSpecialPriceRequestApi");
    expect(source).toContain("approveSpecialPriceRequestApi");
    expect(source).toContain("rejectSpecialPriceRequestApi");
    expect(source).toContain("PENDING_APPROVAL");
  });
});
