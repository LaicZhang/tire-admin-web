import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

describe("commission admin page contract", () => {
  it("registers the commission route and exposes settlement lifecycle actions", () => {
    const routeSource = readFileSync(
      resolve(process.cwd(), "src/router/modules/auth.ts"),
      "utf8"
    );
    const pageSource = readFileSync(
      resolve(process.cwd(), "src/views/company/commission/index.vue"),
      "utf8"
    );

    expect(routeSource).toContain('path: "/company/commission"');
    expect(routeSource).toContain("@/views/company/commission/index.vue");
    expect(pageSource).toContain("createCommissionSettlementApi");
    expect(pageSource).toContain("submitCommissionSettlementApi");
    expect(pageSource).toContain("approveCommissionSettlementApi");
    expect(pageSource).toContain("reverseCommissionSettlementApi");
    expect(pageSource).toContain("按销售员汇总");
  });
});
