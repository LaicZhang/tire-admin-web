import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

describe("price-list management page contract", () => {
  it("exposes detail editing and customer assignment cancellation", () => {
    const source = readFileSync(
      resolve(process.cwd(), "src/views/business/price/index.vue"),
      "utf8"
    );
    expect(source).toContain("getPriceListApi");
    expect(source).toContain("addPriceListDetailApi");
    expect(source).toContain("updatePriceListDetailApi");
    expect(source).toContain("assignPriceListToCustomerApi");
    expect(source).toContain("unassignPriceListCustomerApi");
  });
});
