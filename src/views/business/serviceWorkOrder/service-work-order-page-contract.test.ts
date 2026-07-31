import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

describe("service-work-order page contract", () => {
  it("supports receive, lines, generate SO and checkout", () => {
    const source = readFileSync(
      resolve(process.cwd(), "src/views/business/serviceWorkOrder/index.vue"),
      "utf8"
    );
    expect(source).toContain("createServiceWorkOrderApi");
    expect(source).toContain("addServiceWorkOrderLineApi");
    expect(source).toContain("addPackageToServiceWorkOrderApi");
    expect(source).toContain("generateSaleOrderFromWorkOrderApi");
    expect(source).toContain("checkoutServiceWorkOrderApi");
    expect(source).toContain('value="post/service-work-order/convert"');
    expect(source).toContain('value="post/service-work-order/checkout"');
  });
});
